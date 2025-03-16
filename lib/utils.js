/**
 * Gets the value of a property inside an object
 * even if it was nested with the help of string paths.
 * @param {Object} obj The object to drill.
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
 * Checks if two objects are deeply equal to each other.
 *
 * Meaning even objects must have the exact same key:value pairs on all of their nested childs.
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

/**
 * Performs selection (inclusion or exclusion of object fields based on selection object).
 *
 * If fields in the selection object were set to 1, then all other fields that are
 * not set to 1 will be removed from the target object.
 *
 * If fields in the selection object were set to 0, then these fields will be removed
 * from the target object.
 * @param {Object} obj Object to perform selection on
 * @param {Object} selectionObject Selection object
 * @returns {Object} The selected object
 */
function selectFields(obj, selectionObject) {
    if (!selectionObject) return obj;

    obj = deepCopy(obj);
    let excludes = true;

    for (let key of Object.keys(obj)) {
        if (selectionObject[key] === 0) excludes = false;
    }

    for (let key of Object.keys(obj)) {
        if (selectionObject[key] === 0) {
            delete obj[key];
        }

        if (selectionObject[key] === undefined && excludes) {
            delete obj[key];
        }
    }

    return obj;
}

module.exports = { extractNestedProperty, deepCopy, deepEqual, selectFields };
