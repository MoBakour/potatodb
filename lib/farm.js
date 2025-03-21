// requires
const fs = require("fs");
const { PotatoArray, PotatoId, PotatoError } = require("./potatoes.js");
const {
    extractNestedProperty,
    deepCopy,
    deepEqual,
    selectFields,
} = require("./utils.js");

/**
 * A farm is a collection of data potatoes (documents).
 */
class Farm {
    /**
     * Create a farm (collection of data).
     *
     * @param {string} farmName The name of the farm.
     * @param {string} farmPath The path to the farm file.
     * @param {string} dbName The name of the database that contains this farm.
     * @param {boolean} _id Specifies whether potatoes (documents) in this farm should be stamped with id strings or not.
     * @param {boolean} timestamps Specifies whether potatoes (documents) in this farm
     *      should be stamped with timestamps or not.
     */
    constructor(farmName, farmPath, dbName, _id, timestamps) {
        this.farmName = farmName;
        this.farmPath = farmPath;
        this.dbName = dbName;
        this._id = _id;
        this.timestamps = timestamps;
    }

    // PRIVATE METHODS
    /**
     * Updates a nested property inside an object using a string path that directs to the property.
     *
     * @private
     * @static
     * @param {Object} object The object that contains the nested property.
     * @param {string} path The string path to the nested property.
     * @param {any} val The new value of the nested property.
     */
    static #nestedUpdate(object, path, val) {
        const props = path.split(".");

        props.reduce((obj, prop, index) => {
            return (obj[prop] = props.length === ++index ? val : obj[prop]);
        }, object);
    }

    /**
     * Takes a query object or a test function, if a query object was passed,
     * it will be converted to a test function.
     *
     * @private
     * @static
     * @param {Object | Function} test query object or test function.
     * @returns {Function} A test function.
     */
    static #transform(test) {
        if (typeof test !== "object") return test;

        return (potato) => {
            let matching = [];

            if (Object.keys(test).length === 0) {
                return true;
            }

            for (let key in test) {
                const extractedData = extractNestedProperty(potato, key);

                if (key.startsWith("$")) {
                    const results = [];

                    for (let subquery of test[key]) {
                        results.push(Farm.#transform(subquery));
                    }

                    /**
                     * Logical Operators
                     * Handling multiple query objects with the $and/$or logical operators
                     *
                     * Operators:
                     *      $and        => logical AND  : all provided queries must pass
                     *      $or         => logical OR   : at least one of queries must pass
                     *      $nor        => logical NOR  : all provided queries must fail
                     */

                    switch (key) {
                        case "$and": {
                            matching.push(
                                results.every((result) => result(potato))
                            );
                            break;
                        }
                        case "$or": {
                            matching.push(
                                results.some((result) => result(potato))
                            );
                            break;
                        }
                        case "$nor": {
                            matching.push(
                                results.every((result) => !result(potato))
                            );
                            break;
                        }
                    }
                } else if (test[key] instanceof RegExp) {
                    matching.push(test[key].test(extractedData));
                } else if (typeof test[key] === "object") {
                    for (let specialKey in test[key]) {
                        const passedData = test[key][specialKey];

                        const passedIsArray =
                            Array.isArray(passedData) &&
                            !Array.isArray(extractedData);

                        const extractedIsArray =
                            Array.isArray(extractedData) &&
                            !Array.isArray(passedData);

                        const bothInputsAreArrays =
                            Array.isArray(extractedData) &&
                            Array.isArray(passedData);

                        /**
                         * Query Operators
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
                         *      $elemMatch  => checks if array contains a specific subdocument
                         */

                        switch (specialKey) {
                            case "$gt": {
                                matching.push(extractedData > passedData);
                                break;
                            }
                            case "$gte": {
                                matching.push(extractedData >= passedData);
                                break;
                            }
                            case "$lt": {
                                matching.push(extractedData < passedData);
                                break;
                            }
                            case "$lte": {
                                matching.push(extractedData <= passedData);
                                break;
                            }
                            case "$eq": {
                                matching.push(extractedData === passedData);
                                break;
                            }
                            case "$eqv": {
                                matching.push(extractedData == passedData);
                                break;
                            }
                            case "$neq": {
                                matching.push(extractedData !== passedData);
                                break;
                            }
                            case "$neqv": {
                                matching.push(extractedData != passedData);
                                break;
                            }
                            case "$in": {
                                matching.push(
                                    (extractedIsArray &&
                                        extractedData.includes(passedData)) ||
                                        (passedIsArray &&
                                            passedData.includes(
                                                extractedData
                                            )) ||
                                        (bothInputsAreArrays &&
                                            passedData.some((passedItem) =>
                                                extractedData.includes(
                                                    passedItem
                                                )
                                            ))
                                );

                                break;
                            }
                            case "$nin": {
                                matching.push(
                                    (extractedIsArray &&
                                        !extractedData.includes(passedData)) ||
                                        (passedIsArray &&
                                            !passedData.includes(
                                                extractedData
                                            )) ||
                                        (bothInputsAreArrays &&
                                            !passedData.some((passedItem) =>
                                                extractedData.includes(
                                                    passedItem
                                                )
                                            ))
                                );
                                break;
                            }
                            case "$all": {
                                matching.push(
                                    bothInputsAreArrays &&
                                        passedData.every((passedItem) =>
                                            extractedData.includes(passedItem)
                                        )
                                );
                                break;
                            }
                            case "$elemMatch": {
                                matching.push(
                                    extractedData.some((data) =>
                                        deepEqual(data, passedData)
                                    )
                                );
                                break;
                            }
                        }
                    }
                } else {
                    matching.push(test[key] === extractedData);
                }
            }

            return matching.every((condition) => condition === true);
        };
    }

    /**
     *  Validates the passed test, throws an error if typeof test is not
     *      an object or a function. If test was nullish, it will be replaced with an empty object.
     *
     * @private
     * @static
     * @param {string} caller The name of the function that called this method.
     * @param {Object | Function} test A query object or a test function.
     * @returns {Object | Function} The query object or the test function.
     */
    static #validateQuery(caller, test) {
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
     * Gets the stored data from the farm file.
     *
     * @async
     * @private
     * @returns {Promise<Object[]>} An array of potatoes (documents).
     */
    async #getData() {
        let data = await fs.promises.readFile(this.farmPath, "utf8");
        data = JSON.parse(data);

        return new PotatoArray(...data);
    }

    /**
     * @typedef {Object} PreFindInterceptorOptions
     * @property {boolean} [recent=false] Defines whether priority of search should be to older or recent potato documents.
     * @property {number} [skip=0] Defines the number of potato documents to be skipped before beginning the search.
     */

    /**
     * Pre interceptor applies some options to the data before query is done.
     *
     * @private
     * @static
     * @param {Object[]} data The data.
     * @param {PreFindInterceptorOptions} [options] Options object.
     * @returns {Object[]} Data after applying the options.
     */
    static #preInterceptor(data, options) {
        const { recent = false, skip = 0 } = options || {};

        // reversing
        if (recent) {
            data = data.reverse();
        }

        // skipping
        if (skip < 0)
            throw new PotatoError("Skip value must be a positive number");
        data = data.slice(skip);

        return data;
    }

    /**
     * @typedef {Object} PostFindInterceptorOptions
     * @property {number} [limit] Defines the maximum number of returned potato documents.
     * @property {Object} [sort] Defines the field and the order of sort.
     * @property {Object} [select] Selection object o specify fields to include or exclude.
     * @property {Object} [populate] Population object to fill references fields.
     */

    /**
     * @typedef {Object} PostUpdateInterceptorOptions
     * @property {Object} [sort] Defines the field and the order of sort.
     * @property {Object} [select] Selection object o specify fields to include or exclude.
     * @property {Object} [populate] Population object to fill references fields.
     */

    /**
     * Post interceptor applied some options to the result after query is done.
     *
     * @private
     * @static
     * @async
     * @param {string} caller The name of the function that called this method.
     * @param {Object | Object[]} result The result object or an array of result objects.
     * @param {PostFindInterceptorOptions | PostUpdateInterceptorOptions} [options] Options object.
     * @returns {Promise<Object | Object[]>} The final result object or an array of final result objects.
     */
    static async #postInterceptor(caller, result, options) {
        let { select, populate, sort, limit } = options || {};
        const isArray = Array.isArray(result);

        if (isArray) {
            // limiting
            if (limit && caller.startsWith("find")) {
                result =
                    limit < 0 ? result.slice(limit) : result.slice(0, limit);
            }

            // sorting
            if (sort) {
                result = result.sort(sort);
            }
        }

        // populating
        if (
            populate &&
            typeof populate === "object" &&
            typeof !Array.isArray(populate)
        ) {
            result = isArray ? result : [result];

            for (const ref in populate) {
                for (const doc of result) {
                    if (doc[ref]) {
                        doc[ref] = await populate[ref].findOne({
                            _id: doc[ref],
                        });
                    }
                }
            }

            result = isArray ? result : result[0];
        }

        // selection
        if (isArray) {
            result = result.map((obj) => selectFields(obj, select));
        } else {
            result = selectFields(result, select);
        }

        return isArray ? new PotatoArray(...result) : result;
    }

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
     * Counts the number of potato documents stored in the farm (collection) file.
     *
     * @async
     * @returns {Promise<number>} The number of stored potato documents in farm.
     */
    async countPotatoes(test) {
        try {
            const data = await this.findMany(test);
            // const data = await this.#getData();
            return data.length;
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    /**
     * Inserts potatoes into the farm file.
     *
     * @async
     * @private
     * @param {"insertOne" | "insertMany"} caller The name of the function that called this method.
     * @param {Object | Object[]} newData A potato document, or an array of them.
     * @returns {Promise<Object | Object[]>} The inserted potato document or the array of inserted potato documents.
     */
    async #insertLogic(caller, newData) {
        try {
            // validation
            if (typeof newData !== "object") {
                throw new PotatoError(`${caller} expected a potato document`);
            } else if (caller === "insertOne" && Array.isArray(newData)) {
                throw new PotatoError("insertOne accepts a single potato only");
            } else if (caller === "insertMany" && !Array.isArray(newData)) {
                throw new PotatoError(
                    "insertMany accepts an array of potatoes only"
                );
            }

            const isArray = Array.isArray(newData);
            const data = await this.#getData();
            const { _id, timestamps } = this;

            /**
             * Attaches id string and timestamps on the potato document.
             * @param {Object} obj Potato document object.
             */
            function addStamps(obj) {
                if (_id) {
                    Object.defineProperty(obj, "_id", {
                        value: new PotatoId()._id,
                        enumerable: true,
                    });
                }

                if (timestamps) {
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

            if (!isArray) {
                addStamps(newData);
                data.push(newData);
            } else {
                newData.forEach((obj) => addStamps(obj));
                data.push(...newData);
            }

            await fs.promises.writeFile(this.farmPath, JSON.stringify(data));
            return isArray ? new PotatoArray(...newData) : newData;
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    /**
     * Inserts one potato document into the farm.
     *
     * @async
     * @param {Object} newData Potato (document) object to insert in the farm (collection).
     * @returns {Promise<Object>} The potato document inserted.
     */
    async insertOne(newData) {
        return await this.#insertLogic("insertOne", newData);
    }

    /**
     * Inserts multiple potato documents into the farm.
     *
     * @async
     * @param {Object[]} newData Potato documents to insert in the farm (collection).
     * @returns {Promise<Object[]>} An array of the inserted potato documents.
     */
    async insertMany(newData) {
        return await this.#insertLogic("insertMany", newData);
    }

    /**
     * @typedef {PreFindInterceptorOptions & PostFindInterceptorOptions} FindOptions
     */

    /**
     * Gets potatoes from the farm file.
     *
     * @async
     * @private
     * @param {"findOne" | "findMany"} caller The name of the function that called this method.
     * @param {Object | Function} [test] A query object or a test function.
     * @param {FindOptions} [options] Options object.
     * @returns {Promise<Object | Object[] | null>} A single potato document or an array of them.
     */
    async #findLogic(caller, test, options) {
        try {
            let data = await this.#getData();

            // pre interceptor
            data = Farm.#preInterceptor(data, options);

            // transformation
            test = Farm.#validateQuery(caller, test);
            test = Farm.#transform(test);

            // filtering
            let result;
            if (caller === "findOne") {
                result = data.find(test);

                if (!result) {
                    return null;
                }
            } else if (caller === "findMany") {
                result = data.filter(test);
            } else throw new PotatoError("Invalid caller");

            // post interceptor
            return await Farm.#postInterceptor(caller, result, options);
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    /**
     * Gets a single potato document from the farm.
     *
     * @async
     * @param {Object | Function} [test] A query object or a test function.
     * @param {FindOptions} [options] The options object.
     * @returns {Promise<Object | null>} A single potato document.
     */
    async findOne(test, options) {
        return await this.#findLogic("findOne", test, options);
    }

    /**
     * Gets multiple potato documents from the farm.
     *
     * @async
     * @param {Object | Function} [test] A query object or a test function.
     * @param {FindOptions} [options] The options object.
     * @returns {Promise<Object[]>} An array of potato documents.
     */
    async findMany(test, options) {
        return await this.#findLogic("findMany", test, options);
    }

    /**
     * @typedef {PostUpdateInterceptorOptions & {updated?: boolean}} UpdateOptions
     * @property {boolean} [updated=true] Specifies whether the returned potato document should be the pre-updated or the post-updated version.
     */

    /**
     * Updates specified potatoes in the farm file.
     *
     * @async
     * @private
     * @param {"updateOne" | "updateMany"} caller The name of the function that called this method.
     * @param {Object | Function} test A query object or a test function.
     * @param {Object | Function} updates An updates object or an update function.
     * @param {UpdateOptions} [options] Options object.
     * @returns {Promise<Object | Object[] | null>} The updated potato document or an array of updated potato documents.
     */
    async #updateLogic(caller, test, updates, options) {
        try {
            // options
            const updated = options?.updated ?? true;

            // transformation
            test = Farm.#validateQuery(caller, test);
            test = Farm.#transform(test);

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
            const data = await this.#getData();
            let results = [];

            /**
             * Updates potato document properties in unique ways.
             * @param {string} update Update operator.
             * @param {number} index Potato document index.
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
                        case "$pop": {
                            if (change === 1) {
                                target.pop();
                            } else if (change === -1) {
                                target.shift();
                            }
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
                // alter update function so that it by default return the updated potato document
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

            if (caller === "updateOne") {
                const index = data.findIndex(test);

                if (index === -1) {
                    return null;
                }

                if (!updated) results = deepCopy(data[index]);

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

                if (updated) results = deepCopy(data[index]);
            } else if (caller === "updateMany") {
                const indexes = data
                    .map((potato, index) => {
                        return test(potato) ? index : -1;
                    })
                    .filter((index) => index !== -1);

                for (let i = 0; i < indexes.length; i++) {
                    if (!updated) results.push(deepCopy(data[indexes[i]]));

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

                    if (updated) results.push(deepCopy(data[indexes[i]]));
                }
            } else throw new PotatoError("Invalid caller");

            await fs.promises.writeFile(this.farmPath, JSON.stringify(data));

            return await Farm.#postInterceptor(caller, results, options);
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    /**
     * Updates a single potato document in the farm.
     *
     * @async
     * @param {Object | Function} test A query object or a test function.
     * @param {Object | Function} updates An update object or update function.
     * @param {UpdateOptions} [options] Options object.
     * @returns {Promise<Object | null>} The updated potato document.
     */
    async updateOne(test, updates, options) {
        return await this.#updateLogic("updateOne", test, updates, options);
    }

    /**
     * Updates multiple potato documents in the farm.
     *
     * @async
     * @param {Object | Function} test A query object or a test function.
     * @param {Object | Function} updates An update object or update function.
     * @param {UpdateOptions} [options] Options object.
     * @returns {Promise<Object[]>} An array of the updated potato documents.
     */
    async updateMany(test, updates, options) {
        return await this.#updateLogic("updateMany", test, updates, options);
    }

    /**
     * @typedef {Object} DeleteOptions
     * @property {Object} [select] Selection object to specify fields to include or exclude.
     */

    /**
     * Deletes specified potatoes from the farm file.
     *
     * @async
     * @private
     * @param {"deleteOne" | "deleteMany"} caller The name of the function that called this method.
     * @param {Object | Function} [test] A query object or a test function.
     * @param {DeleteOptions} [options] Options object.
     * @returns {Promise<Object | Object[] | null>} The deleted potato document or an array of deleted potato documents.
     */
    async #deleteLogic(caller, test, options) {
        // validation
        test = Farm.#validateQuery(caller, test);
        test = Farm.#transform(test);

        // delete process
        try {
            const data = await this.#getData();
            let results = [];

            if (caller == "deleteOne") {
                const index = data.findIndex(test);

                if (index === -1) {
                    return null;
                }

                results = data[index];
                data.splice(index, 1);
            } else if (caller == "deleteMany") {
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
                    results.push(data[indexes[i]]);
                    data.splice(indexes[i], 1);
                }
            } else throw new PotatoError("Invalid caller");

            await fs.promises.writeFile(this.farmPath, JSON.stringify(data));

            return await Farm.#postInterceptor(caller, results, options);
        } catch (err) {
            throw new PotatoError(err.message);
        }
    }

    /**
     * Deletes a single potato document from the farm.
     *
     * @async
     * @param {Object | Function} [test] A query object or a test function.
     * @param {DeleteOptions} [options] Options object.
     * @returns {Promise<Object | null>} The deleted potato document.
     */
    async deleteOne(test, options) {
        return await this.#deleteLogic("deleteOne", test, options);
    }

    /**
     * Deletes multiple potato documents from the farm.
     *
     * @async
     * @param {Object | Function} [test] A query object or a test function.
     * @param {DeleteOptions} [options] Options object.
     * @returns {Promise<Object[]>} An array of the deleted potato documents.
     */
    async deleteMany(test, options) {
        return await this.#deleteLogic("deleteMany", test, options);
    }

    /**
     * Checks if a potato document exists in the farm file.
     *
     * @async
     * @param {Object | Function} test A query object or a test function.
     * @returns {Promise<boolean>} A boolean value indicating whether the potato document exists or not.
     */
    async exists(test) {
        return !!(await this.findOne(test));
    }

    /**
     * Gets a random a single potato document from the farm file.
     *
     * @async
     * @returns {Promise<Object | null>} A single potato document.
     */
    async sampleOne() {
        const data = await this.#getData();
        return data[Math.floor(Math.random() * data.length)] || null;
    }

    /**
     * Gets multiple random potato documents from the farm file.
     *
     * @async
     * @param {number} count The number of potato documents to sample.
     * @returns {Promise<Object[]>} An array of potato documents.
     */
    async sampleMany(count) {
        const data = await this.#getData();
        const samples = [];

        for (let i = 0; i < count; i++) {
            const sample = data[Math.floor(Math.random() * data.length)];
            if (sample !== undefined) {
                samples.push(sample);
            }
        }

        return new PotatoArray(...samples);
    }

    /**
     * Gets multiple random unique potato documents from the farm file.
     *
     * @async
     * @param {number} count The number of unique potato documents to sample.
     * @returns {Promise<Object[]>} An array of unique potato documents.
     */
    async sampleManyUnique(count) {
        const data = await this.#getData();

        // fisher-yates shuffle
        for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
        }

        if (count >= data.length) return data;
        return new PotatoArray(...data.slice(0, count));
    }
}

// exports
module.exports = Farm;
