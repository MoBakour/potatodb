// requires
const fs = require("fs");
const path = require("path");
const Farm = require("./farm.js");

// default potato databases root path
let POTATODB_ROOT_PATH = path.join(__dirname, "databases");

/**
 * Sets the root directory of the potato databases.
 * @param {string} rootPath The path to the root directory of the databases.
 * @param {string} rootName The name of the root directory of the databases.
 */
const setRoot = (rootPath = __dirname, rootName = "databases") => {
    POTATODB_ROOT_PATH = path.join(rootPath, rootName);
};

/**
 * Creates a new database.
 * @param {string} dbName The name of the database.
 * @param {boolean} overwrite Specifies whether the data stored inside the DB
 *      should be deleted and overwritten when the hosting server is restarted.
 * @returns {PotatoDB} A potato database class.
 */
const createDatabase = async (dbName, overwrite = false) => {
    const DB = new PotatoDB(dbName, overwrite);
    await DB.init();
    return DB;
};

/**
 * Potato database class.
 */
class PotatoDB {
    /**
     *
     * @param {string} dbName database name.
     */
    constructor(dbName, overwrite) {
        let dbRoot = POTATODB_ROOT_PATH;
        let dbPath = path.join(dbRoot, dbName);

        this.dbRoot = dbRoot; // Project/databases
        this.dbPath = dbPath; // Project/databases/db
        this.dbName = dbName; // db
        this.farms = [];
        this.overwrite = overwrite;
    }

    /**
     * Asynchronous - Initializes the potato database, creates the databases root directory and
     *      the database directory if they don't exist.
     */
    async init() {
        if (!fs.existsSync(this.dbRoot)) {
            try {
                await fs.promises.mkdir(this.dbRoot);
            } catch (err) {
                throw err;
            }
        }

        if (!fs.existsSync(this.dbPath)) {
            try {
                await fs.promises.mkdir(this.dbPath);
            } catch (err) {
                throw err;
            }
        }
    }

    /**
     * Asynchronous - Creates a new farm inside the database.
     * @param {string} farmName The name of the farm.
     * @param {object} options Farm options.
     * @returns {Farm} A farm class.
     */
    async createFarm(
        farmName,
        { identifications = true, timestamps = true } = {}
    ) {
        this.farms.push(farmName);
        const farmPath = path.join(this.dbPath, `${farmName}.json`);

        try {
            if (!fs.existsSync(farmPath) || this.overwrite) {
                await fs.promises.writeFile(farmPath, "[]");
            }
        } catch (err) {
            throw err;
        }

        return new Farm(
            farmName,
            farmPath,
            this.dbName,
            identifications,
            timestamps
        );
    }

    /**
     * Drops a database, deletes the database directory and all of it's content from the databases root directory.
     */
    dropDatabase() {
        try {
            fs.rmSync(this.dbPath, { recursive: true, force: true });
        } catch (err) {
            throw err;
        }
    }
}

// exports
module.exports = {
    setRoot,
    createDatabase,
};
