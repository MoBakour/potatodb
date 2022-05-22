// import PotatoDB
const PotatoDB = require("./PotatoDB.js");

// set root
PotatoDB.setRoot("databases");

(async () => {
    // create databases
    const WebDB = await PotatoDB.createDatabase("WebDB");

    // create farms
    const Users = await WebDB.createFarm("users", true);

    // interact with the farm
    const insert_one = await Users.insertOne({ username: "Swordax", age: 17 });
    const insert_many = await Users.insertMany([
        { username: "Alxa", age: 15 },
        { username: "Yori", age: 13 },
        { username: "Zakho", age: 19 },
    ]);

    const find_one = await Users.findOne({ username: "Swordax" });
    const find_many = await Users.findMany();

    const update_one = await Users.updateOne(
        { username: "Zakho" },
        { age: 22 }
    );
    const update_many = await Users.updateMany({}, { isMarried: false });

    const delete_one = await Users.deleteOne({ username: "Zakho" });
    const delete_many = await Users.deleteMany({});
})();
