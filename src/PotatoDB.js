// requires
const fs = require("fs");
const path = require("path");
const Farm = require("./farm.js");

// set PotatoDB databases root
let POTATODB_ROOT_PATH = path.join(__dirname, "databases");
const setRoot = (rootPath, rootName) => {
    POTATODB_ROOT_PATH = path.join(rootPath, rootName);
};

// create PotatoDB database
const createDatabase = async (dbName) => {
    const DB = new PotatoDB(dbName);
    await DB.init();
    return DB;
};

// database class
class PotatoDB {
    constructor(dbName) {
        let dbRoot = POTATODB_ROOT_PATH;
        let dbPath = path.join(dbRoot, dbName);

        this.dbRoot = dbRoot; // Project/databases
        this.dbPath = dbPath; // Project/databases/db
        this.dbName = dbName; // db
        this.farms = [];
    }

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

    async createFarm(farmName, overwrite = false) {
        this.farms.push(farmName);
        const farmPath = path.join(this.dbPath, `${farmName}.json`);

        try {
            if (!fs.existsSync(farmPath) || overwrite) {
                await fs.promises.writeFile(farmPath, "[]");
            }
        } catch (err) {
            throw err;
        }

        return new Farm(farmName, farmPath, this.dbName);
    }

    dropDatabase() {
        try {
            fs.rmSync(this.dbPath, { recursive: true, force: true });
        } catch (err) {
            throw err;
        }
    }
}

// export resources
module.exports = {
    setRoot,
    createDatabase,
};
