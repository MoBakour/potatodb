// import PotatoDB
const PotatoDB = require("./PotatoDB.js");

// set root
PotatoDB.setRoot("infobases");

(async () => {
    // create databases
    const WebDB = await PotatoDB.createDatabase("WebDB");

    // create farms
    const Users = await WebDB.createFarm("users", true);

    // interact with the farm
    Users.insertOne({ username: "Swordax", age: 17 });
})();
