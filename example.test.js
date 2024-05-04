const { setRoot, createDatabase } = require("./index.js");

setRoot(__dirname, "databases");

const DB = createDatabase("DB", true);
const Users = DB.createFarm("Users", {
    identifications: true,
    timestamps: true,
});

const data = [
    {
        name: "Swordax",
        age: 19,
        isMarried: false,
        hobbies: ["coding", "swimming", "ping pong"],
        education: {
            schools: ["Sama", "AWPS", "Shaimaa"],
            college: "Istinye",
            gpa: 3.48,
        },
    },
    {
        name: "Vazox",
        age: 19,
        isMarried: false,
        hobbies: ["drawing", "walking", "football"],
        education: {
            schools: ["Tafawuq", "Shoola", "AWPS"],
            college: "Istinye",
            gpa: 2.78,
        },
    },
    {
        name: "Alxa",
        age: 25,
        isMarried: true,
        hobbies: ["golf", "traveling", "writing"],
        education: {
            schools: ["Masa", "Doha"],
            college: "Sharjah",
            gpa: 3.22,
        },
    },
    {
        name: "Moxa",
        age: 23,
        isMarried: true,
        hobbies: ["writing", "coding"],
        education: {
            schools: ["Sama"],
            college: "Istinye",
            gpa: 3.77,
        },
    },
];

(async () => {
    await Users.insertMany(data);

    const result = await Users.deleteMany();

    console.log(result);
})();
