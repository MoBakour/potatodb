const crypto = require("crypto");
const { extractNestedProperty } = require("./utils.js");

/**
 * Potato array class. Derived and extended from the built-it Array constructor,
 *      but with a custom array sort method that accepts object based sorting.
 * @extends {Array}
 */
class PotatoArray extends Array {
    constructor(...args) {
        super(...args);
    }

    /**
     * Sorting method that accepts an object argument that specifies the potato
     *      property to sort by and whether the sorting should go in an ascending
     *      or a descending order.
     * @param {Object | Function | undefined} sortBy Specifies sorting property and order.
     * @returns {array} Sorted version of the array.
     */
    sort(sortBy) {
        if (
            sortBy &&
            typeof sortBy !== "object" &&
            typeof sortBy !== "function"
        ) {
            throw new PotatoError(
                "PotatoArray.sort() expected a sortBy object or function, or an undefined value"
            );
        }

        if (typeof sortBy === "object") {
            if (Object.keys(sortBy).length !== 1) {
                throw new PotatoError(
                    "PotatoArray.sort() expected a single sortBy property"
                );
            } else if (typeof sortBy[Object.keys(sortBy)[0]] !== "number") {
                throw new PotatoError(
                    "PotatoArray.sort() expected a number value in the sortBy object"
                );
            }
        }

        let sortFunc;
        if (typeof sortBy === "object") {
            const key = Object.keys(sortBy)[0];
            const asc = Math.abs(sortBy[key]) == sortBy[key];

            sortFunc = (a, b) => {
                const previous = extractNestedProperty(a, key);
                const next = extractNestedProperty(b, key);

                return asc ? previous - next : next - previous;
            };
        } else {
            sortFunc = sortBy;
        }

        return super.sort(sortFunc);
    }
}

/**
 * Potato id class. Provides a unique id string to be attached to a potato object.
 */
class PotatoId {
    constructor() {
        this._id = crypto.randomBytes(16).toString("hex");
    }
}

/**
 * Potato error class. Derived and extended from the built-in Error constructor,
 *      used to distinguish potato errors and make them unique.
 * @extends {Error}
 */
class PotatoError extends Error {
    constructor(...args) {
        super(...args);
        this.name = "PotatoError";
    }
}

// exports
module.exports = { PotatoArray, PotatoId, PotatoError };
