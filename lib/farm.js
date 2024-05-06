// requires
const fs = require("fs");
const { PotatoArray, PotatoId, PotatoError } = require("./potatoes.js");
const { extractNestedProperty, deepCopy } = require("./utils.js");

/**
 * A farm is a collection of data potatoes (documents).
 */
class Farm {
    /**
     * Create a farm (collection of data).
     * @param {string} farmName The name of the farm.
     * @param {string} farmPath The path to the farm file.
     * @param {string} dbName The name of the database that contains this farm.
     * @param {boolean} identifications Specifies whether potatoes (documents) in
     *      this farm should be stamped with identification strings or not.
     * @param {boolean} timestamps Specifies whether potatoes (documents) in this farm
     *      should be stamped with timestamps or not.
     */
    constructor(farmName, farmPath, dbName, identifications, timestamps) {
        this.farmName = farmName;
        this.farmPath = farmPath;
        this.dbName = dbName;
        this.identifications = identifications;
        this.timestamps = timestamps;
    }

    // PRIVATE METHODS
    /**
     * Private - Updates a nested property inside an object using a string path that directs to the property.
     * @param {object} object The object that contains the nested property.
     * @param {string} path The string path to the nested property.
     * @param {*} val The new value of the nested property.
     */
    static #nestedUpdate(object, path, val) {
        const props = path.split(".");

        props.reduce((obj, prop, index) => {
            return (obj[prop] = props.length === ++index ? val : obj[prop]);
        }, object);
    }

    /**
     *  Private - Takes a query object or a test function, if a query object was passed,
     * it will be converted to a test function
     * @param {object | function} test query object or test function.
     * @returns {function} A test function
     */
    static #query(test) {
        if (typeof test === "object") {
            let query = test;

            test = (potato) => {
                let matching = false;

                if (Object.keys(query).length === 0) {
                    return true;
                }

                for (let key in query) {
                    const extractedData = extractNestedProperty(potato, key);

                    /**
                     * Handling query operators.
                     * Query operators are used to make querying farms and selecting data easier.
                     *
                     * Operators:
                     *      $gt         => greater than
                     *      $gte        => greater than or equal to
                     *      $lt         => less than
                     *      $lte        => less than or equal to
                     *      $eq         => equal to
                     *      $eqv        => equal to (regardless of value data type)
                     *      $neq        => not equal to
                     *      $neqv       => not equal to (regardless of value data type)
                     *      $in         => checks if array/string includes a value (array/string to string)
                     *                  => checks if value is among list of values (string to array)
                     *                  => checks if array contains some of values (array to array)
                     *      $nin        => checks if array/string does not include a value (array/string to string)
                     *                  => checks if value is not among list of values (string to array)
                     *                  => checks if array does not contain any of values (array to array)
                     *      $all        => checks if array contains all values (array to array)
                     */
                    if (typeof query[key] === "object") {
                        for (let specialKey in query[key]) {
                            const passedData = query[key][specialKey];

                            const passedIsArray =
                                Array.isArray(passedData) &&
                                !Array.isArray(extractedData);

                            const extractedIsArray =
                                Array.isArray(extractedData) &&
                                !Array.isArray(passedData);

                            const bothInputsAreArrays =
                                Array.isArray(extractedData) &&
                                Array.isArray(passedData);

                            switch (specialKey) {
                                case "$gt": {
                                    matching = extractedData > passedData;
                                    break;
                                }
                                case "$gte": {
                                    matching = extractedData >= passedData;
                                    break;
                                }
                                case "$lt": {
                                    matching = extractedData < passedData;
                                    break;
                                }
                                case "$lte": {
                                    matching = extractedData <= passedData;
                                    break;
                                }
                                case "$eq": {
                                    matching = extractedData === passedData;
                                    break;
                                }
                                case "$eqv": {
                                    matching = extractedData == passedData;
                                    break;
                                }
                                case "$neq": {
                                    matching = extractedData !== passedData;
                                    break;
                                }
                                case "$neqv": {
                                    matching = extractedData != passedData;
                                    break;
                                }
                                case "$in": {
                                    matching =
                                        (extractedIsArray &&
                                            extractedData.includes(
                                                passedData
                                            )) ||
                                        (passedIsArray &&
                                            passedData.includes(
                                                extractedData
                                            )) ||
                                        (bothInputsAreArrays &&
                                            passedData.some((passedItem) =>
                                                extractedData.includes(
                                                    passedItem
                                                )
                                            ));

                                    break;
                                }
                                case "$nin": {
                                    matching =
                                        (extractedIsArray &&
                                            !extractedData.includes(
                                                passedData
                                            )) ||
                                        (passedIsArray &&
                                            !passedData.includes(
                                                extractedData
                                            )) ||
                                        (bothInputsAreArrays &&
                                            !passedData.some((passedItem) =>
                                                extractedData.includes(
                                                    passedItem
                                                )
                                            ));
                                    break;
                                }
                                case "$all": {
                                    matching =
                                        bothInputsAreArrays &&
                                        passedData.every((passedItem) =>
                                            extractedData.includes(passedItem)
                                        );
                                    break;
                                }
                            }
                        }
                    } else {
                        if (query[key] === extractedData) {
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
     *  Private - Validates the passed test, throws an error if typeof test is not
     *      an object or a function. If test was nullish, it will be replaced with an empty object.
     * @param {object | function} test A query object or a test function.
     * @param {string} caller The name of the function that called this method.
     * @returns {object} The query object or the test function.
     */
    static #validateQuery(test, caller) {
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
     *  Asynchronous - Gets the stored data from the farm file.
     * @returns {Promise<object[]>} An array of potatoes (documents).
     */
    async #getData() {
        let data = await fs.promises.readFile(this.farmPath, "utf8");
        data = JSON.parse(data);

        return new PotatoArray(...data);
    }

    // FARM METHODS
    /**
     * Deletes this farm.
     */
    dropFarm() {
        try {
            fs.unlinkSync(this.farmPath);
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    /**
     * Asynchronous - Counts the number of potatoes (documents) stored in the farm (collection) file.
     * @returns {Promise<number>} The number of stored potatoes (documents).
     */
    async countPotatoes() {
        try {
            const data = await this.#getData();
            return data.length;
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    // INSERT
    /**
     * Private - Asynchronous - Inserts potatoes into the farm file.
     * @param {object | object[]} newData A potato (document) object, or an array of them.
     * @param {string} caller The name of the function that called this method.
     * @returns {Promise<object | object[]>} The inserted potato object or the array of inserted potato objects.
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
            const isIdentificated = this.identifications;
            const isTimestamped = this.timestamps;

            /**
             * Attaches identification string and timestamps on the potato object.
             * @param {object} obj Potato (document) object.
             */
            function addStamps(obj) {
                if (isIdentificated) {
                    Object.defineProperty(obj, "_id", {
                        value: new PotatoId()._id,
                        enumerable: true,
                    });
                }

                if (isTimestamped) {
                    const date = Date.now();
                    Object.defineProperties(obj, {
                        createdAt: {
                            value: date,
                            enumerable: true,
                        },
                        updatedAt: {
                            value: date,
                            enumerable: true,
                            writable: true,
                        },
                    });
                }
            }

            if (type == "single") {
                addStamps(newData);
                data.push(newData);
            } else {
                newData.forEach((obj) => addStamps(obj));
                data.push(...newData);
            }

            await fs.promises.writeFile(this.farmPath, JSON.stringify(data));
            return type == "many" ? new PotatoArray(...newData) : newData;
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    /**
     * Inserts one potato object into the farm
     * @param {object} newData Potato (document) object to insert in the farm (collection)
     * @returns {Promise<object>} The potato object inserted
     */
    async insertOne(newData) {
        return await this.#insertLogic(newData, "insertOne()");
    }

    /**
     * Inserts multiple potato objects into the farm
     * @param {object[]} newData Potato (document) objects to insert in the farm (collection)
     * @returns {Promise<object[]>} An array of the inserted potato objects
     */
    async insertMany(newData) {
        return await this.#insertLogic(newData, "insertMany()");
    }

    // FIND
    /**
     * Private - Asynchronous - Gets potatoes from the farm file.
     * @param {object | function | undefined} test A query object or a test function.
     * @param {object | undefined} options Options object.
     * @param {string} caller The name of the function that called this method.
     * @returns {Promise<object | object[]>} A single potato object or an array of them.
     */
    async #findLogic(test, options, caller) {
        const limit = options?.limit; // includes
        const skip = options?.skip || 0; // excludes
        const recent = options?.recent || false; // reverses
        const sort = options?.sort;

        // validation
        test = Farm.#validateQuery(test, caller);
        test = Farm.#query(test);

        // find process
        try {
            let data = await this.#getData();

            data = recent ? data.reverse() : data;

            data =
                skip < 0 ? data.slice(0, data.length + skip) : data.slice(skip);

            if (caller == "findOne()") {
                return test ? data.find(test) : data[0];
            } else {
                let result = test ? data.filter(test) : data;

                result =
                    limit < 0 ? result.slice(limit) : result.slice(0, limit);

                result = sort ? result.sort(sort) : result;

                return new PotatoArray(...result);
            }
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    /**
     * Gets a single potato object from the farm
     * @param {object | function | undefined} test A query object or a test function
     * @param {{limit: number, skip: number, recent: boolean, sort: object} | undefined} options The options object
     *
     * limit option defines the maximum number of returned potato objects
     *
     * skip option defines the number of potato objects to be skipped before beginning the search
     *
     * recent option defines whether priority of search should be to oldest or recent potato objects
     *
     * sort option defines the field and the order of sort
     *
     * @returns {Promise<object>} A single potato object
     */
    async findOne(test, options) {
        return await this.#findLogic(test, options, "findOne()");
    }

    /**
     * Gets multiple potato objects from the farm
     * @param {object | function | undefined} test A query object or a test function
     * @param {{limit: number, skip: number, recent: boolean, sort: object} | undefined} options The options object
     *
     * limit option defines the maximum number of returned potato objects
     *
     * skip option defines the number of potato objects to be skipped before beginning the search
     *
     * recent option defines whether priority of search should be to oldest or recent potato objects
     *
     * sort option defines the field and the order of sort
     *
     * @returns {Promise<object[]>} An array of potato objects
     */
    async findMany(test, options) {
        return await this.#findLogic(test, options, "findMany()");
    }

    // UPDATE
    /**
     * Private - Asynchronous - Updates specified potatoes in the farm file.
     * @param {object | function} test A query object or a test function.
     * @param {object | function} updates An updates object or an update function.
     * @param {boolean | undefined} updated Sepcified whether the returned value if post-update or pre-update.
     * @param {string} caller The name of the function that called this method.
     * @returns {Promise<object | array>} The updated potato object or an array of updated potato objects.
     */
    async #updateLogic(test, updates, updated = true, caller) {
        // validation
        test = Farm.#validateQuery(test, caller);
        test = Farm.#query(test);

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
                 *      $addToSet   => adds a value into a set only if value doesn't already exist
                 *      $pull       => removes a specific value from an array
                 *      $concat     => concatenates two values of same type (string or array) together
                 */

                for (let key of keys) {
                    let target = extractNestedProperty(data[index], key);
                    let change = updates[update][key];

                    switch (update) {
                        case "$inc": {
                            target += change;
                            break;
                        }
                        case "$push": {
                            target.push(change);
                            break;
                        }
                        case "$addToSet": {
                            const targetSet = new Set(target);
                            targetSet.add(change);
                            target = [...targetSet];
                            break;
                        }
                        case "$pull": {
                            target = target.filter((item) => item !== change);
                            break;
                        }
                        case "$concat": {
                            target = target.concat(change);
                            break;
                        }
                    }

                    Farm.#nestedUpdate(data[index], key, target);
                }
            }

            const operatorUpdates = {};
            const nonOperatorUpdates = {};

            if (typeof updates === "function") {
                // alter update function so that it by default return the updated potato object
                const originalUpdatesFunc = updates;
                updates = function (item) {
                    originalUpdatesFunc(item);
                    return item;
                };
            } else {
                // sort updates types
                for (let update in updates) {
                    if (update.startsWith("$")) {
                        operatorUpdates[update] = updates[update];
                    } else {
                        nonOperatorUpdates[update] = updates[update];
                    }
                }
            }

            if (caller == "updateOne()") {
                const index = data.findIndex(test);
                if (!updated) returns = deepCopy(data[index]);

                if (typeof updates === "function") {
                    data[index] = updates(data[index]);
                } else {
                    for (let update in operatorUpdates) {
                        operatorAction(update, index);
                    }

                    for (let update in nonOperatorUpdates) {
                        Farm.#nestedUpdate(
                            data[index],
                            update,
                            nonOperatorUpdates[update]
                        );
                    }

                    // update the timestamp
                    if (this.timestamps) {
                        data[index].updatedAt = Date.now();
                    }
                }

                if (updated) returns = deepCopy(data[index]);
            } else {
                const indexes = data
                    .map((potato, index) => {
                        return test(potato) ? index : -1;
                    })
                    .filter((index) => index !== -1);

                for (let i = 0; i < indexes.length; i++) {
                    if (!updated) returns.push(deepCopy(data[indexes[i]]));

                    if (typeof updates === "function") {
                        data[indexes[i]] = updates(data[indexes[i]]);
                    } else {
                        for (let update in operatorUpdates) {
                            operatorAction(update, indexes[i]);
                        }

                        for (let update in nonOperatorUpdates) {
                            Farm.#nestedUpdate(
                                data[indexes[i]],
                                update,
                                nonOperatorUpdates[update]
                            );
                        }

                        // update the timestamp
                        if (this.timestamps) {
                            data[indexes[i]].updatedAt = Date.now();
                        }
                    }

                    if (updated) returns.push(deepCopy(data[indexes[i]]));
                }
            }

            await fs.promises.writeFile(this.farmPath, JSON.stringify(data));
            return Array.isArray(returns)
                ? new PotatoArray(...returns)
                : returns;
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    /**
     * Updates a single potato object in the farm
     * @param {object | function} test A query object or a test function
     * @param {object | function} updates An update object or update function
     * @param {boolean | undefined} updated Option to define whether returned data is post or pre update
     * @returns {Promise<object>} The updates potato object
     */
    async updateOne(test, updates, updated) {
        return await this.#updateLogic(test, updates, updated, "updateOne()");
    }

    /**
     * Updates multiple potato objects in the farm
     * @param {object | function} test A query object or a test function
     * @param {object | function} updates An update object or update function
     * @param {boolean | undefined} updated Option to define whether returned data is post or pre update
     * @returns {Promise<object[]>} An array of the updated potato objects
     */
    async updateMany(test, updates, updated) {
        return await this.#updateLogic(test, updates, updated, "updateMany()");
    }

    // DELETE
    /**
     * Private - Asynchronous - Deletes specified potatoes from the farm file.
     * @param {object | function | undefined} test A query object or a test function.
     * @param {string} caller The name of the function that called this method.
     * @returns {Promise<object | array>} The deleted potato object or an array of deleted potato objects.
     */
    async #deleteLogic(test, caller) {
        // validation
        test = Farm.#validateQuery(test, caller);
        test = Farm.#query(test);

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
            throw new PotatoError(err.message);
        }
    }

    /**
     * Deletes a single potato object from the farm
     * @param {object | function | undefined} test A query object or a test function
     * @returns {Promise<object>} The deleted potato object
     */
    async deleteOne(test) {
        return await this.#deleteLogic(test, "deleteOne()");
    }

    /**
     * Deletes multiple potato objects from the farm
     * @param {object | function | undefined} test A query object or a test function
     * @returns {Promise<object[]>} An array of the deleted potato objects
     */
    async deleteMany(test) {
        return await this.#deleteLogic(test, "deleteMany()");
    }
}

// exports
module.exports = Farm;
