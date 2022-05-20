// required dependencies
const fs = require("fs");
const path = require("path");

// set PotatoDB databases root
let POTATODB_ROOT = "databases";
const setRoot = (root) => {
    POTATODB_ROOT = root;
};

// create PotatoDB database
const createDatabase = async (dbName) => {
    const DB = new PotatoDB(dbName, POTATODB_ROOT);
    await DB.init();
    return DB;
};

// database class
class PotatoDB {
    constructor(dbName, dbRoot = "databases") {
        dbRoot = path.join(__dirname, dbRoot);
        let dbPath = path.join(dbRoot, dbName);

        this.dbRoot = dbRoot; // Project/databases
        this.dbPath = dbPath; // Project/databases/db
        this.dbName = dbName; // db
        this.farms = [];
    }

    async init() {
        if (!fs.existsSync(this.dbRoot)) {
            try {
                await fs.promises.mkdir(this.dbRoot);
            } catch (err) {
                throw err;
            }
        }

        if (!fs.existsSync(this.dbPath)) {
            try {
                await fs.promises.mkdir(this.dbPath);
            } catch (err) {
                throw err;
            }
        }
    }

    async createFarm(farmName) {
        this.farmName = farmName;
        this.farms.push(farmName);

        try {
            await fs.promises.writeFile(
                path.join(this.dbPath, `${farmName}.json`),
                "[]"
            );
        } catch (err) {
            throw err;
        }

        return new Farm(farmName, this.dbName, this.dbPath);
    }
}

class Farm {
    constructor(farmName, dbName, dbPath) {
        this.farmName = farmName;
        this.dbName = dbName;
        this.filePath = path.join(dbPath, `${this.farmName}.json`);
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
        if (typeof test !== "function" && typeof test !== "object") {
            throw Error(
                `PotatoDB Type Error: ${caller} expected a test function or a query object as a first argument`
            );
        }
    }
    async #getData() {
        let data = await fs.promises.readFile(this.filePath);
        data = data.toString();
        data = JSON.parse(data);

        return data;
    }

    // INSERT
    async #insertLogic(newData, caller) {
        // validation
        if (typeof newData !== "object") {
            throw Error(
                `PotatoDB Type Error: ${caller} expected a potato object`
            );
        } else if (caller == "insertOne()" && Array.isArray(newData)) {
            throw Error(
                "PotatoDB Type Error: insertOne() accepts a single potato only"
            );
        } else if (caller == "insertMany()" && !Array.isArray(newData)) {
            throw Error(
                "PotatoDB Type Error: insertMany() accepts an array of potatos only"
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

            await fs.promises.writeFile(this.filePath, JSON.stringify(data));
            return data;
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
    async #findLogic(test, caller) {
        // validation
        this.#validateQuery(test, caller);
        test = this.#query(test);

        // find process
        try {
            const data = await this.#getData();

            if (caller == "findOne()") {
                return test ? data.find(test) : data[0];
            } else {
                let result = test ? data.filter(test) : data;
                return result;
            }
        } catch (err) {
            throw err;
        }
    }
    async findOne(test) {
        return await this.#findLogic(test, "findOne()");
    }
    async findMany(test) {
        return await this.#findLogic(test, "findMany()");
    }

    // UPDATE
    async #updateLogic(test, updates, caller) {
        // validation
        this.#validateQuery(test, caller);

        if (!updates || typeof updates !== "object") {
            throw Error(
                `PotatoDB Update Error: ${caller} expected an updates object as a second argument`
            );
        }

        test = this.#query(test);

        // update process
        try {
            const data = await this.#getData();

            if (caller == "updateOne()") {
                const index = data.findIndex(test);
                data[index] = { ...data[index], ...updates };
            } else {
                const indexes = data
                    .map((potato, index) => {
                        return test(potato) ? index : -1;
                    })
                    .filter((index) => index !== -1);

                for (let i = 0; i < indexes.length; i++) {
                    data[indexes[i]] = { ...data[indexes[i]], ...updates };
                }
            }

            await fs.promises.writeFile(this.filePath, JSON.stringify(data));
            return data;
        } catch (err) {
            throw err;
        }
    }
    async updateOne(test, updates) {
        return await this.#updateLogic(test, updates, "updateOne()");
    }
    async updateMany(test, updates) {
        return await this.#updateLogic(test, updates, "updateMany()");
    }

    // DELETE
    async #deleteLogic(test, caller) {
        // validation
        this.#validateQuery(test, caller);
        test = this.#query(test);

        // delete process
        try {
            const data = await this.#getData();

            if (caller == "deleteOne()") {
                const index = data.findIndex(test);
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
                    data.splice(indexes[i], 1);
                }
            }

            await fs.promises.writeFile(this.filePath, JSON.stringify(data));
            return data;
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

// export resources
module.exports = {
    setRoot,
    createDatabase,
};