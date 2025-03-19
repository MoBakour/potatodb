const express = require("express");
const { setRoot, createDatabase } = require("potatodb");

const app = express();

// configure express app
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// set potatodb root
setRoot({
    rootPath: process.cwd(),
    rootName: "databases",
});

// create project database and users farm
let DB, Users, Posts;
(async () => {
    DB = await createDatabase("DB", false);

    const farmOptions = {
        _id: true,
        timestamps: true,
    };

    Users = await DB.createFarm("Users", farmOptions);
    Posts = await DB.createFarm("Posts", farmOptions);

    // listen to server requests
    app.listen(3000, () => {
        console.log("Server running on port 3000");
    });
})();

// create user
app.post("/create-user", async (req, res) => {
    try {
        const user = await Users.insertOne(req.body);
        res.status(200).json({ success: true, userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// get user
app.get("/get-user", async (req, res) => {
    try {
        const user = await Users.findOne(
            { username: req.body.username },
            {
                select: {
                    password: 0,
                },
            }
        );
        res.status(200).json({ success: true, user });
    } catch (err) {
        console.error(err);
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
            3- sort data according to "user.personal_information.age" field in ascending order
        */

        const users = await Users.findMany(
            {},
            {
                skip: resultsPerPage * (req.params.pageNumber - 1),
                limit: resultsPerPage,
                recent: true,
                sort: {
                    "personal_information.age": 1,
                },
                select: {
                    password: 0,
                },
            }
        );

        res.status(200).json({ success: true, users });
    } catch (err) {
        console.error(err);
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
                select: {
                    password: 0,
                },
            }
        );

        res.status(200).json({ success: true, updatedUser });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// publish post
app.post("/post", async (req, res) => {
    try {
        const postObject = {
            ...req.body,
            owner: req.user._id,
        };

        const post = await Posts.insertOne(postObject);
        res.status(200).json({ success: true, postId: post._id });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// find post
app.get("/post/:postId", async (req, res) => {
    try {
        const post = await Posts.findOne(
            { _id: req.params.postId },
            {
                populate: {
                    owner: Users,
                },
                select: {
                    post_token: 0,
                    owner: {
                        password: 0,
                    },
                },
            }
        );
        res.status(200).json({ success: true, post });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, error: err.message });
    }
});
