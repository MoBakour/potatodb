const PotatoDB = require("./PotatoDB.js");

PotatoDB.setRoot("potatos");

(async () => {
    const DB = await PotatoDB.createDatabase("DB");
    const Users = await DB.createFarm("users");
    await Users.insertOne({ username: "Swordax", age: 17 });
})();
