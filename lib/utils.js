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

module.exports = { extractNestedProperty };
