const { setRoot, createDatabase } = require("./index.js");

setRoot(__dirname, "databases");

const DB = createDatabase("DB", true);
const Users = DB.createFarm("Users", {
    identifications: true,
    timestamps: true,
});

const data = (() => {
    const names = [
        "Swordax",
        "Vazox",
        "Alxa",
        "Swordy",
        "Swordia",
        "Alximia",
        "Naxos",
        "Poxia",
    ];

    const dataArray = [];

    names.forEach((name) => {
        dataArray.push({ name, age: Math.floor(Math.random() * 22) + 1 });
    });

    return dataArray;
})();

(async () => {
    await Users.insertMany(data);

    const result = await Users.findMany({});
    console.log(result);
})();
