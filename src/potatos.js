// potato array class
class PotatoArray extends Array {
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

// potato error class
class PotatoError extends Error {
    constructor(message) {
        super(message);
        this.name = "PotatoError";
    }
}

// exports
module.exports = { PotatoArray, PotatoError };
