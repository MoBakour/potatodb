// import PotatoDB
const PotatoDB = require("./src/PotatoDB.js");

// set root
PotatoDB.setRoot(__dirname, "infobases");

(async () => {
    // create databases
    const WebDB = await PotatoDB.createDatabase("WebDB");

    // create farms
    const Users = await WebDB.createFarm("users", true);

    // interact with the farm
    await Users.insertMany([
        { username: "Swordax", age: 17 },
        { username: "Alxa", age: 15 },
        { username: "Yori", age: 13 },
        { username: "Zakho", age: 19 },
    ]);

    const result = await Users.findMany({}, { limit: 2 });
    console.log(result);
})();
