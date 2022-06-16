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

// potato id class
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

// potato error class
class PotatoError extends Error {
    constructor(message) {
        super(message);
        this.name = "PotatoError";
    }
}

// exports
module.exports = { PotatoArray, PotatoId, PotatoError };
