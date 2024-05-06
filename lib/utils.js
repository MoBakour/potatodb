/**
 * Gets the value of a property inside an object
 * even if it wasnested with the help of string paths.
 * @param {object} obj The object to drill.
 * @param {string} path The string path to the property.
 * @returns {*} The property value.
 */
function extractNestedProperty(obj, path) {
    const keys = path.split(".");
    let result = obj;

    for (let i = 0; i < keys.length; i++) {
        result = result[keys[i]];
    }

    return result;
}

/**
 * Creates a deep copy of the provided value
 * @param {*} obj Object to copy
 * @returns {*} The copy
 */
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks if two objects are deeply equal to each other
 * Meaning even objects must have the exact same key:value pairs on all of their nested childs
 * @param {*} x First object
 * @param {*} y Second object
 * @returns {boolean} Boolean indicating equality
 */
function deepEqual(x, y) {
    const xType = typeof x;
    const yType = typeof y;
    const ok = Object.keys;

    if (x && y && xType === "object" && xType === yType) {
        return (
            ok(x).length === ok(y).length &&
            ok(x).every((k) => deepEqual(x[k], y[k]))
        );
    } else {
        return x === y;
    }
}

module.exports = { extractNestedProperty, deepCopy, deepEqual };
