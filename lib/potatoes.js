/**
 * Potato array class. Derived and extended from the built-it Array constructor,
 *      but with a custom array sort method that accepts object based sorting.
 * @extends {Array}
 */
class PotatoArray extends Array {
    /**
     * Sorting method that accepts an object argument that specifies the potato
     *      property to sort by and whether the sorting should go in an ascending
     *      or a descending order.
     * @param {object} sortBy Specifies sorting property and order.
     * @returns {array} Sorted version of the array.
     */
    sort(sortBy) {
        if (!sortBy || typeof sortBy !== "object") {
            throw PotatoError("sort() expected a sortBy object");
        } else if (Object.keys(sortBy).length !== 1) {
            throw PotatoError("sort() expected a single sortBy property");
        } else if (typeof sortBy[Object.keys(sortBy)[0]] !== "number") {
            throw PotatoError(
                "sort() expected a number value in the sortBy object"
            );
        }

        const key = Object.keys(sortBy)[0];
        const asc = Math.abs(sortBy[key]) == sortBy[key];

        return super.sort((a, b) => {
            return asc ? a[key] - b[key] : b[key] - a[key];
        });
    }
}

/**
 * Potato identification class. Provides a unique identification string to be
 *      attached to a potato object.
 */
class PotatoId {
    constructor() {
        let _id = Date.now().toString().split("");

        const chars = "qwertyuioplkjhgfdsazxcvbnm";
        const charsLength = Math.round(_id.length / 2);
        for (let i = 0; i < charsLength; i++) {
            const randIndex = Math.floor(Math.random() * (_id.length + 1));
            const randChar = chars[Math.floor(Math.random() * chars.length)];
            _id.splice(randIndex, 0, randChar);
        }

        this._id = _id.join("");
    }
}

/**
 * Potato error class. Derived and extended from the built-in Error constructor,
 *      used to distinguish potato errors and make them unique.
 * @extends {Error}
 */
class PotatoError extends Error {
    constructor(message) {
        super(message);
        this.name = "PotatoError";
    }
}

// exports
module.exports = { PotatoArray, PotatoId, PotatoError };