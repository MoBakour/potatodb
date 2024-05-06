const express = require("express");
const { setRoot, createDatabase } = require("potatodb");

const app = express();

// configure express app
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// set potatodb root
setRoot(__dirname, "databases");

// create project database and users farm
let DB, User;
(async () => {
    DB = await createDatabase("DB", false);
    User = await DB.createFarm("Users", {
        identifications: true,
        timestamps: true,
    });

    // listen to server requests
    app.listen(3000, () => {
        console.log("Server running on port 3000");
    });
})();

// create user
app.post("/create-user", async (req, res) => {
    try {
        const user = await User.insertOne(req.body);
        res.status(200).json({ success: true, userId: user._id });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// get user
app.get("/get-user", async (req, res) => {
    try {
        const user = await User.findOne(
            { username: req.body.username },
            { project: { password: 0 } }
        );
        res.status(200).json({ success: true, user });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// get users (implementing pagination)
app.get("/get-users/:pageNumber", async (req, res) => {
    const resultsPerPage = 10;

    try {
        /*
            1- implement pagination using skip and limit options
            2- show most recent data first
            3- sort data according to "user.personalInformation.age" field in ascending order
        */

        const users = await User.findMany(
            {},
            {
                skip: resultsPerPage * (req.params.pageNumber - 1),
                limit: resultsPerPage,
                recent: true,
                sort: {
                    "personalInformation.age": 1,
                },
                project: {
                    password: 0,
                },
            }
        );

        res.status(200).json({ success: true, users });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// update username
app.patch("/update-username", async (req, res) => {
    try {
        const updatedUser = await User.updateOne(
            {
                username: req.body.username,
            },
            {
                username: req.body.newUsername,
            },
            {
                updated: true,
                project: {
                    password: 0,
                },
            }
        );

        res.status(200).json({ success: true, updatedUser });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// delete user
app.delete("/delete-user/:userId", async (req, res) => {
    try {
        const deletedUser = await User.deleteOne(
            { _id: req.params.userId },
            { project: { password: 0 } }
        );
        res.status(200).json({ success: true, deletedUser });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});
