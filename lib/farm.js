// requires
const fs = require("fs");
const { PotatoArray, PotatoId, PotatoError } = require("./potatoes.js");

/**
 * A farm is a collection of data potatoes (documents).
 */
class Farm {
    /**
     * Create a farm (collection of data).
     * @param {string} farmName The name of the farm.
     * @param {string} farmPath The path to the farm file.
     * @param {string} dbName The name of the database that contains this farm.
     * @param {boolean} isIdentificated Specifies whether potatoes (documents) in
     *      this farm should be stamped with an identification string or not.
     */
    constructor(farmName, farmPath, dbName, isIdentificated) {
        this.farmName = farmName;
        this.farmPath = farmPath;
        this.dbName = dbName;
        this.isIdentificated = isIdentificated;
    }

    // PRIVATE GENERAL METHODS
    /**
     * Private - Takes a query object or a test function, if a test function was passed,
     * it will be converted to a query object.
     * @param {object | function} test query object or test function.
     * @returns {object} A query object
     */
    #query(test) {
        /**
         * Gets the value of a nested object property using a string path.
         * @param {object} obj The object to drill.
         * @param {*} accessKeys The string path to the nested property.
         * @returns {*} The nested property value.
         */
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

                    /**
                     * Handling query operators.
                     * Query operators are used to make querying farms and selecting data easier.
                     *
                     * Operators:
                     *      $gt         => greater than
                     *      $gte        => greater than or equil to
                     *      $lt         => less than
                     *      $lte        => less than or equil to
                     *      $eq         => equil to
                     *      $eqv        => equil to (regardless of value data type)
                     *      $includes   => checks if array/string includes a value
                     */
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

    /**
     * Private - Validates the passed test, throws an error if typeof test is not
     *      an object or a function. If test was nullish, it will be replaced with an empty object.
     * @param {object | function} test A query object or a test function.
     * @param {string} caller The name of the function that called this method.
     * @returns {object} The query object or the test function.
     */
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

    /**
     * Private - Asynchronous - Gets the stored data from the farm file.
     * @returns {Promise<object[]>} An array of potatoes (documents).
     */
    async #getData() {
        let data = await fs.promises.readFile(this.farmPath);
        data = data.toString();
        data = JSON.parse(data);

        return data;
    }

    // FARM METHODS
    /**
     * Deletes this farm.
     */
    dropFarm() {
        try {
            fs.unlinkSync(this.farmPath);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Asynchronous - Counts the number of potatoes (documents) stored in the farm (collection) file.
     * @returns {number} The number of stored potatoes (documents).
     */
    async countPotatoes() {
        try {
            const data = await this.#getData();
            return data.length;
        } catch (err) {
            throw err;
        }
    }

    // INSERT
    /**
     * Private - Asynchronous - Inserts potatoes into the farm file.
     * @param {object | array} newData A potato (document) object, or an array of them.
     * @param {string} caller The name of the function that called this method.
     * @returns {object | array} The inserted potato object or the array of inserted potato objects.
     */
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

            /**
             * Uses PotatoId() class to create a new identification object and attaches
             *      the identification string into the potato object.
             * @param {object} obj Potato (document) object.
             */
            function addIdentification(obj) {
                Object.defineProperty(obj, "_id", {
                    value: new PotatoId()._id,
                    enumerable: true,
                    writable: false,
                    configurable: false,
                });
            }

            if (type == "single") {
                if (this.isIdentificated) addIdentification(newData);
                data.push(newData);
            } else {
                if (this.isIdentificated)
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
    /**
     * Private - Asynchronous - Gets potatoes from the farm file.
     * @param {object | function} test A query object or a test function.
     * @param {object} options Options object.
     * @param {string} caller The name of the function that called this method.
     * @returns {object | array} A single potato object or an array of them.
     */
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
    /**
     * Private - Asynchronous - Updates specified potatoes in the farm file.
     * @param {object | function} test A query object or a test function.
     * @param {object | function} updates An updates object or an update function.
     * @param {boolean} updated Sepcified whether the returned value if post-update or pre-update.
     * @param {string} caller The name of the function that called this method.
     * @returns {object | array} The updated potato object or an array of updated potato objects.
     */
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

            /**
             * Updates potato object properties in unique ways.
             * @param {string} update Update operator.
             * @param {number} index Potato object index.
             */
            function operatorAction(update, index) {
                const keys = Object.keys(updates[update]);

                /**
                 * Update operators:
                 *      $inc        => increments a number value
                 *      $push       => pushes a value into an array
                 *      $concat     => concatenates two values of same type (string or array) together
                 *      $pull       => removes a specific value from an array
                 */

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

            /**
             * Updates a nested property inside an object using a string path that directs to the property.
             * @param {object} object The object that contains the nested property.
             * @param {string} path The string path to the nested property.
             * @param {*} val The new value of the nested property.
             */
            function nestedUpdate(object, path, val) {
                const props = path.split(".");

                props.reduce((obj, prop, index) => {
                    return (obj[prop] =
                        props.length === ++index ? val : obj[prop]);
                }, object);
            }

            const operatorUpdates = {};
            const customUpdates = {};
            const nestedUpdates = {};

            if (typeof updates === "function") {
                // alter update function so that it by default return the updated potato object
                const originalUpdatesFunc = updates;
                updates = function (item) {
                    originalUpdatesFunc(item);
                    return item;
                };
            } else {
                // sort updates
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
                        nestedUpdate(
                            data[index],
                            update,
                            nestedUpdates[update]
                        );
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
                            nestedUpdate(
                                data[indexes[i]],
                                update,
                                nestedUpdates[update]
                            );
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
    /**
     * Private - Asynchronous - Deletes specified potatoes from the farm file.
     * @param {object | function} test A query object or a test function.
     * @param {string} caller The name of the function that called this method.
     * @returns {object | array} The deleted potato object or an array of deleted potato objects.
     */
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
