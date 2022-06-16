// requires
const fs = require("fs");
const { PotatoArray, PotatoId, PotatoError } = require("./potatoes.js");

// farm class
class Farm {
    constructor(farmName, farmPath, dbName, identification) {
        this.farmName = farmName;
        this.farmPath = farmPath;
        this.dbName = dbName;
        this.identification = identification;
    }

    // PRIVATE GENERAL FUNCS
    #query(test) {
        function getFromNested(obj, accessKeys) {
            const keys = accessKeys.split(".");

            let result = obj;
            for (let i = 0; i < keys.length; i++) {
                result = result[keys[i]];
            }

            return result;
        }

        if (typeof test === "object") {
            let query = test;

            test = (potato) => {
                let matching = false;

                for (let key in query) {
                    const nestedData = getFromNested(potato, key);

                    if (typeof query[key] === "object") {
                        for (let specialKey in query[key]) {
                            const passedData = query[key][specialKey];

                            if (
                                (specialKey === "$gt" &&
                                    nestedData > passedData) ||
                                (specialKey === "$gte" &&
                                    nestedData >= passedData) ||
                                (specialKey === "$lt" &&
                                    nestedData < passedData) ||
                                (specialKey === "$lte" &&
                                    nestedData <= passedData) ||
                                (specialKey === "$eq" &&
                                    nestedData === passedData) ||
                                (specialKey === "$eqv" &&
                                    nestedData == passedData) ||
                                (specialKey === "$includes" &&
                                    nestedData.includes(passedData))
                            ) {
                                matching = true;
                            }
                        }
                    } else {
                        if (query[key] == nestedData) {
                            matching = true;
                        }
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
    async countPotatoes() {
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
                "insertMany accepts an array of potatoes only"
            );
        }

        const type = Array.isArray(newData) ? "many" : "single";

        // insert process
        try {
            const data = await this.#getData();

            function addIdentification(obj) {
                Object.defineProperty(obj, "_id", {
                    value: new PotatoId()._id,
                    enumerable: true,
                    writable: false,
                    configurable: false,
                });
            }

            if (type == "single") {
                if (this.identification) addIdentification(newData);
                data.push(newData);
            } else {
                if (this.identification)
                    newData.forEach((obj) => addIdentification(obj));
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
        test = this.#query(test);

        if (
            !updates &&
            typeof updates !== "function" &&
            typeof updates !== "object"
        ) {
            throw new PotatoError(
                `${caller} expected an updates object or function as a second argument`
            );
        }

        // update process
        try {
            const data = await this.#getData();
            let returns = [];

            function operatorAction(update, index) {
                const keys = Object.keys(updates[update]);

                switch (update) {
                    case "$inc": {
                        for (let key of keys) {
                            data[index][key] += updates[update][key];
                        }

                        break;
                    }
                    case "$push": {
                        for (let key of keys) {
                            data[index][key].push(updates[update][key]);
                        }

                        break;
                    }
                    case "$concat": {
                        for (let key of keys) {
                            data[index][key] = data[index][key].concat(
                                updates[update][key]
                            );
                        }

                        break;
                    }
                    case "$pull": {
                        for (let key of keys) {
                            data[index][key] = data[index][key].filter(
                                (item) => item !== updates[update][key]
                            );
                        }

                        break;
                    }
                }
            }

            function nestedUpdate(object, path, val) {
                const props = path.split(".");

                props.reduce((obj, prop, index) => {
                    return (obj[prop] =
                        props.length === ++index ? val : obj[prop]);
                }, object);
            }

            function applyNestedUpdate(on, update) {
                nestedUpdate(on, update, nestedUpdates[update]);
            }

            const operatorUpdates = {};
            const customUpdates = {};
            const nestedUpdates = {};
            if (typeof updates === "function") {
                // alter update function
                const originalUpdatesFunc = updates;
                updates = function (item) {
                    originalUpdatesFunc(item);
                    return item;
                };
            } else {
                // filter updates
                for (let update in updates) {
                    if (update.startsWith("$")) {
                        operatorUpdates[update] = updates[update];
                    } else if (update.includes(".")) {
                        nestedUpdates[update] = updates[update];
                    } else {
                        customUpdates[update] = updates[update];
                    }
                }
            }

            if (caller == "updateOne()") {
                const index = data.findIndex(test);
                if (!updated) returns = data[index];

                if (typeof updates === "function") {
                    data[index] = updates(data[index]);
                } else {
                    for (let update in operatorUpdates) {
                        operatorAction(update, index);
                    }

                    for (let update in nestedUpdates) {
                        applyNestedUpdate(data[index], update);
                    }

                    data[index] = { ...data[index], ...customUpdates };
                }

                if (updated) returns = data[index];
            } else {
                const indexes = data
                    .map((potato, index) => {
                        return test(potato) ? index : -1;
                    })
                    .filter((index) => index !== -1);

                for (let i = 0; i < indexes.length; i++) {
                    if (!updated) returns.push(data[indexes[i]]);

                    if (typeof updates === "function") {
                        data[indexes[i]] = updates(data[indexes[i]]);
                    } else {
                        for (let update in operatorUpdates) {
                            operatorAction(update, indexes[i]);
                        }

                        for (let update in nestedUpdates) {
                            applyNestedUpdate(data[indexes[i]], update);
                        }

                        data[indexes[i]] = {
                            ...data[indexes[i]],
                            ...customUpdates,
                        };
                    }

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
