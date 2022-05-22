// requires
const fs = require("fs");
const path = require("path");
const { PotatoArray, PotatoError } = require("./potatos.js");

// farm class
class Farm {
    constructor(farmName, farmPath, dbName) {
        this.farmName = farmName;
        this.farmPath = farmPath;
        this.dbName = dbName;
    }

    // PRIVATE GENERAL FUNC
    #query(test) {
        if (typeof test == "object") {
            let query = test;
            test = (potato) => {
                let matching = true;
                for (let key in query) {
                    if (query[key] !== potato[key]) {
                        matching = false;
                    }
                }
                return matching;
            };
        }

        return test;
    }
    #validateQuery(test, caller) {
        if (!test) {
            test = {};
        }

        if (typeof test !== "function" && typeof test !== "object") {
            throw new PotatoError(
                `${caller} expected a test function or a query object as a first argument`
            );
        }

        return test;
    }
    async #getData() {
        let data = await fs.promises.readFile(this.farmPath);
        data = data.toString();
        data = JSON.parse(data);

        return data;
    }

    // FARM METHODS
    dropFarm() {
        try {
            fs.unlinkSync(this.farmPath);
        } catch (err) {
            throw err;
        }
    }
    async countPotatos() {
        try {
            const data = await this.#getData();
            return data.length;
        } catch (err) {
            throw err;
        }
    }

    // INSERT
    async #insertLogic(newData, caller) {
        // validation
        if (typeof newData !== "object") {
            throw new PotatoError(`${caller} expected a potato object`);
        } else if (caller == "insertOne()" && Array.isArray(newData)) {
            throw new PotatoError("insertOne() accepts a single potato only");
        } else if (caller == "insertMany()" && !Array.isArray(newData)) {
            throw new PotatoError(
                "insertMany accepts an array of potatos only"
            );
        }

        const type = Array.isArray(newData) ? "many" : "single";

        // insert process
        try {
            const data = await this.#getData();

            if (type == "single") {
                data.push(newData);
            } else {
                data.push(...newData);
            }

            await fs.promises.writeFile(this.farmPath, JSON.stringify(data));
            return type == "many" ? new PotatoArray(...newData) : newData;
        } catch (err) {
            throw err;
        }
    }
    async insertOne(newData) {
        return await this.#insertLogic(newData, "insertOne()");
    }
    async insertMany(newData) {
        return await this.#insertLogic(newData, "insertMany()");
    }

    // FIND
    async #findLogic(test, options, caller) {
        const limit = options?.limit;
        const skip = options?.skip;

        // validation
        test = this.#validateQuery(test, caller);
        test = this.#query(test);

        // find process
        try {
            const data = await this.#getData();

            if (caller == "findOne()") {
                return test ? data.find(test) : data[0];
            } else {
                const skippedData = data.slice(skip);
                let result = test ? skippedData.filter(test) : skippedData;
                result = result.slice(0, limit);
                return new PotatoArray(...result);
            }
        } catch (err) {
            throw err;
        }
    }
    async findOne(test, options) {
        return await this.#findLogic(test, options, "findOne()");
    }
    async findMany(test, options) {
        return await this.#findLogic(test, options, "findMany()");
    }

    // UPDATE
    async #updateLogic(test, updates, updated = true, caller) {
        // validation
        test = this.#validateQuery(test, caller);

        if (!updates || typeof updates !== "object") {
            throw new PotatoError(
                `${caller} expected an updates object as a second argument`
            );
        }

        test = this.#query(test);

        // update process
        try {
            const data = await this.#getData();
            let returns = [];

            if (caller == "updateOne()") {
                const index = data.findIndex(test);

                if (!updated) returns = data[index];
                data[index] = { ...data[index], ...updates };
                if (updated) returns = data[index];
            } else {
                const indexes = data
                    .map((potato, index) => {
                        return test(potato) ? index : -1;
                    })
                    .filter((index) => index !== -1);

                for (let i = 0; i < indexes.length; i++) {
                    if (!updated) returns.push(data[indexes[i]]);
                    data[indexes[i]] = { ...data[indexes[i]], ...updates };
                    if (updated) returns.push(data[indexes[i]]);
                }
            }

            await fs.promises.writeFile(this.farmPath, JSON.stringify(data));
            return Array.isArray(returns)
                ? new PotatoArray(...returns)
                : returns;
        } catch (err) {
            throw err;
        }
    }
    async updateOne(test, updates, updated) {
        return await this.#updateLogic(test, updates, updated, "updateOne()");
    }
    async updateMany(test, updates, updated) {
        return await this.#updateLogic(test, updates, updated, "updateMany()");
    }

    // DELETE
    async #deleteLogic(test, caller) {
        // validation
        test = this.#validateQuery(test, caller);
        test = this.#query(test);

        // delete process
        try {
            const data = await this.#getData();
            let returns = [];

            if (caller == "deleteOne()") {
                const index = data.findIndex(test);
                returns = data[index];
                data.splice(index, 1);
            } else {
                let decrement = 0;

                let indexes = data
                    .map((potato, index) => {
                        if (test(potato)) {
                            return index - decrement++;
                        }

                        return null;
                    })
                    .filter((index) => index !== null);

                for (let i = 0; i < indexes.length; i++) {
                    returns.push(data[indexes[i]]);
                    data.splice(indexes[i], 1);
                }
            }

            await fs.promises.writeFile(this.farmPath, JSON.stringify(data));
            return Array.isArray(returns)
                ? new PotatoArray(...returns)
                : returns;
        } catch (err) {
            throw err;
        }
    }
    async deleteOne(test) {
        return await this.#deleteLogic(test, "deleteOne()");
    }
    async deleteMany(test) {
        return await this.#deleteLogic(test, "deleteMany()");
    }
}

// exports
module.exports = Farm;
