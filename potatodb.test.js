const { setRoot, createDatabase } = require("./index.js");
const fs = require("fs");
const path = require("path");

// Mock setup for database and farms
let DB, Users, Posts;

beforeAll(async () => {
    setRoot({ rootName: "test_database" });
    DB = createDatabase("DB", {
        overwrite: true,
    });
    Users = DB.createFarm("Users", {
        _id: true,
        timestamps: true,
    });
    Posts = DB.createFarm("Posts", {
        _id: true,
        timestamps: true,
    });
});

afterAll(async () => {
    // Clean up by dropping the database
    await DB.dropDatabase();
});

beforeEach(async () => {
    // Clear the collections before each test to ensure no data dependency between tests
    await Users.deleteMany({});
    await Posts.deleteMany({});
});

describe("PotatoDB Operations", () => {
    // DB MANAGEMENT TESTS
    test("Create and drop database", () => {
        const database = createDatabase("TestDB");

        const dbPath = path.join(process.cwd(), "test_database", "TestDB");
        const exists = fs.existsSync(dbPath);
        expect(exists).toBe(true);

        database.dropDatabase();
        const notExists = fs.existsSync(dbPath);
        expect(notExists).toBe(false);
    });

    test("Create and drop collection", () => {
        const Collection = DB.createFarm("Collection");

        const collectionPath = path.join(
            process.cwd(),
            "test_database",
            "DB",
            "Collection.json"
        );

        const exists = fs.existsSync(collectionPath);
        expect(exists).toBe(true);

        Collection.dropFarm();
        const notExists = fs.existsSync(collectionPath);
        expect(notExists).toBe(false);
    });

    // DB OPERATIONS TESTS
    test("Insert one document", async () => {
        const user = await Users.insertOne({
            username: "Swordax",
            email: "swordax@example.com",
            age: 25,
        });
        expect(user._id).toBeDefined();
        expect(user.username).toBe("Swordax");
    });

    test("Insert multiple documents", async () => {
        const users = await Users.insertMany([
            { username: "User1", email: "user1@example.com", age: 30 },
            { username: "User2", email: "user2@example.com", age: 22 },
        ]);
        expect(users.length).toBe(2);
        expect(users[0].username).toBe("User1");
    });

    test("Find one document", async () => {
        await Users.insertOne({ username: "Swordax", age: 25 });
        const foundUser = await Users.findOne({ age: { $gte: 20 } });
        expect(foundUser).toBeDefined();
        expect(foundUser.age).toBeGreaterThanOrEqual(20);
    });

    test("Find many documents", async () => {
        await Users.insertMany([
            { username: "User1", age: 25 },
            { username: "User2", age: 22 },
        ]);
        const users = await Users.findMany({ age: { $gte: 20 } });
        expect(users.length).toBe(2);
    });

    test("Functional query", async () => {
        await Users.insertMany([
            { username: "User1", age: 25 },
            { username: "User2", age: 22 },
        ]);

        const users = await Users.findMany((user) => user.age > 22);
        expect(users.length).toBe(1);
        expect(users[0].age).toBeGreaterThan(22);
    });

    test("Nested query", async () => {
        await Users.insertMany([
            {
                username: "User1",
                email: "user1@example.com",
                address: {
                    city: "Dubai",
                    country: "UAE",
                },
            },
            {
                username: "User2",
                email: "user2@example.com",
                address: {
                    city: "Jeddah",
                    country: "Saudi Arabia",
                },
            },
        ]);

        const user = await Users.findOne({
            "address.city": "Dubai",
        });

        expect(user.username).toBe("User1");
    });

    test("Update document", async () => {
        const user = await Users.insertOne({
            username: "Swordax",
            age: 25,
        });

        await Users.updateOne({ _id: user._id }, { age: 26 });
        const updatedUser = await Users.findOne({ _id: user._id });

        expect(updatedUser.age).toBe(26);
    });

    test("Update multiple documents", async () => {
        await Users.insertMany([
            { username: "User1", age: 22 },
            { username: "User2", age: 22 },
        ]);

        await Users.updateMany({ age: 22 }, { $inc: { age: 1 } });
        const updatedUsers = await Users.findMany({ age: 23 });
        expect(updatedUsers.length).toBe(2);
    });

    test("Functional update", async () => {
        await Users.insertOne({
            username: "Swordax",
            token: 0,
        });

        await Users.updateOne({ username: "Swordax" }, (user) => {
            user.token = Math.floor(Math.random() * 11);
        });

        const updatedUser = await Users.findOne({ username: "Swordax" });
        expect(updatedUser.token).toBeGreaterThanOrEqual(0);
        expect(updatedUser.token).toBeLessThanOrEqual(10);
    });

    test("Nested update", async () => {
        await Users.insertOne({
            username: "User1",
            email: "user1@example.com",
            address: {
                city: "Dubai",
                country: "UAE",
            },
        });

        await Users.updateOne(
            { username: "User1" },
            { "address.city": "Abu Dhabi" }
        );

        const updatedUser = await Users.findOne({ username: "User1" });
        expect(updatedUser.address.city).toBe("Abu Dhabi");
    });

    test("Delete document", async () => {
        const user = await Users.insertOne({ username: "Swordax", age: 25 });
        const deletedUser = await Users.deleteOne({ _id: user._id });
        expect(deletedUser).toBeDefined();
        expect(deletedUser._id).toBe(user._id);
    });

    test("Delete multiple documents", async () => {
        await Users.insertMany([
            { username: "User1", age: 22 },
            { username: "User2", age: 22 },
        ]);
        const deletedUsers = await Users.deleteMany({ age: 22 });
        expect(deletedUsers.length).toBe(2);
    });

    // ADDITIONAL OPERATIONS TESTS
    test("Check if document exists", async () => {
        await Users.insertOne({
            username: "Swordax",
            email: "swordax@example.com",
        });

        const exists = await Users.exists({ email: "swordax@example.com" });
        expect(exists).toBe(true);

        const notExists = await Users.exists({
            email: "nonexistent@example.com",
        });
        expect(notExists).toBe(false);
    });

    test("Count documents", async () => {
        await Users.insertMany([
            { username: "User1", age: 20 },
            { username: "User2", age: 22 },
            { username: "User3", age: 20 },
        ]);

        const count = await Users.countPotatoes({ age: 20 });
        expect(count).toBe(2);
    });

    test("Sample random document", async () => {
        await Users.insertOne({
            username: "Swordax",
            email: "swordax@example.com",
        });

        const randomUser = await Users.sampleOne();
        expect(randomUser.username).toBe("Swordax");
    });

    test("Sample multiple random documents", async () => {
        await Users.insertMany([
            { username: "User1", email: "user1@example.com" },
            { username: "User2", email: "user2@example.com" },
        ]);

        const randomUsers = await Users.sampleMany(2);
        expect(randomUsers.length).toBe(2);
    });

    test("Sample many unique random documents", async () => {
        await Users.insertMany([
            { username: "User1", email: "user1@example.com" },
            { username: "User2", email: "user2@example.com" },
        ]);

        const uniqueUsers = await Users.sampleManyUnique(2);
        expect(uniqueUsers.length).toBe(2);
    });

    // OPTIONS TESTS
    test("Object sorting", async () => {
        await Users.insertMany([
            { username: "User1", age: 25 },
            { username: "User2", age: 30 },
        ]);

        const descending = await Users.findMany({}, { sort: { age: -1 } });
        expect(descending[0].age).toBeGreaterThan(descending[1].age);

        const ascending = await Users.findMany({}, { sort: { age: 1 } });
        expect(ascending[0].age).toBeLessThan(ascending[1].age);
    });

    // test for functional sorting
    test("Functional sorting", async () => {
        await Users.insertMany([
            { username: "User1", age: 25 },
            { username: "User2", age: 30 },
        ]);

        const descending = await Users.findMany(
            {},
            { sort: (a, b) => b.age - a.age }
        );
        expect(descending[0].age).toBeGreaterThan(descending[1].age);

        const ascending = await Users.findMany(
            {},
            { sort: (a, b) => a.age - b.age }
        );
        expect(ascending[0].age).toBeLessThan(ascending[1].age);
    });

    test("Select specific fields", async () => {
        await Users.insertMany([
            { username: "User1", email: "user1@example.com", age: 30 },
        ]);
        const users = await Users.findMany(
            {},
            { select: { username: 1, age: 1 } }
        );
        expect(users[0].email).toBeUndefined();
        expect(users[0].username).toBeDefined();
    });

    test("Select nested fields", async () => {
        await Users.insertOne({
            username: "User1",
            email: "user1@example.com",
            age: 30,
            address: {
                city: "New York",
                country: "USA",
            },
        });

        const user = await Users.findOne(
            {},
            { select: { username: 1, address: { city: 1 } } }
        );

        expect(user.email).toBeUndefined();
        expect(user.address.country).toBeUndefined();
        expect(user.address.city).toBe("New York");
    });

    test("Populate referenced field", async () => {
        const user = await Users.insertOne({ username: "Swordax" });
        const post = await Posts.insertOne({
            owner: user._id,
            title: "Post Title",
            text: "This is interesting!",
        });

        const retrievedPost = await Posts.findOne(
            { _id: post._id },
            {
                populate: {
                    owner: Users,
                },
            }
        );

        expect(retrievedPost.owner.username).toBe("Swordax");
    });

    test("Limit documents", async () => {
        await Users.insertMany([
            { username: "User1", age: 25 },
            { username: "User2", age: 30 },
            { username: "User3", age: 35 },
            { username: "User4", age: 40 },
        ]);

        const users = await Users.findMany({}, { limit: 2 });
        expect(users.length).toBe(2);
    });

    test("Skip documents", async () => {
        await Users.insertMany([
            { username: "User1", age: 25 },
            { username: "User2", age: 30 },
            { username: "User3", age: 35 },
            { username: "User4", age: 40 },
        ]);

        const users = await Users.findMany({}, { skip: 2 });
        expect(users.length).toBe(2);
        expect(users[0].age).toBe(35);
    });

    test("Recent documents", async () => {
        await Users.insertMany([
            { username: "User1", age: 25 },
            { username: "User2", age: 30 },
            { username: "User3", age: 35 },
            { username: "User4", age: 40 },
        ]);

        const recentUsers = await Users.findMany({}, { recent: true });
        expect(recentUsers[0].age).toBe(40);
    });

    test("Updated documents", async () => {
        const user = await Users.insertOne({ username: "Swordax", age: 25 });

        const updatedUser = await Users.updateOne(
            { _id: user._id },
            { age: 26 },
            { updated: true }
        );
        expect(updatedUser.age).toBe(26);

        const notUpdatedUser = await Users.updateOne(
            { _id: user._id },
            { age: 27 },
            { updated: false }
        );
        expect(notUpdatedUser.age).toBe(26);
    });

    // REGEX TEST
    test("RegExp query", async () => {
        await Users.insertMany([
            { username: "Some User", email: "user1@example.com" },
            { username: "SomeOtherUser", email: "user2@example.com" },
            { username: "Someone Else", email: "non@applicable.com" },
        ]);

        const users = await Users.findMany({ email: /example/ });
        expect(users.length).toBe(2);

        const singleWordUsersnames = await Users.findMany({
            username: /^\w+$/,
        });
        expect(singleWordUsersnames.length).toBe(1);
    });

    // QUERY OPERATOR TESTS
    test("Comparison operators", async () => {
        await Users.insertMany([
            { username: "User1", age: 25 },
            { username: "User2", age: 30 },
            { username: "User3", age: 35 },
            { username: "User4", age: 40 },
            { username: "User5", age: 45 },
            { username: "User6", age: 50 },
        ]);

        const users = await Users.findMany({ age: { $gt: 25 } });
        expect(users.length).toBe(5);

        const users2 = await Users.findMany({ age: { $gte: 35 } });
        expect(users2.length).toBe(4);

        const users3 = await Users.findMany({ age: { $lt: 40 } });
        expect(users3.length).toBe(3);

        const users4 = await Users.findMany({ age: { $lte: 30 } });
        expect(users4.length).toBe(2);

        const users5 = await Users.findMany({ age: { $eq: 30 } });
        expect(users5.length).toBe(1);

        const users6 = await Users.findMany({ age: { $neq: 30 } });
        expect(users6.length).toBe(5);
    });

    test("Array operators", async () => {
        await Users.insertMany([
            { username: "User1", tags: ["tag1", "tag2"] },
            { username: "User2", tags: ["tag2", "tag3"] },
            { username: "User3", tags: ["tag3", "tag4"] },
        ]);

        const users = await Users.findMany({ tags: { $in: "tag2" } });
        expect(users.length).toBe(2);

        const users1 = await Users.findMany({
            tags: { $in: ["tag2", "tag3"] },
        });
        expect(users1.length).toBe(3);

        const users2 = await Users.findMany({ tags: { $nin: ["tag2"] } });
        expect(users2.length).toBe(1);

        const users3 = await Users.findMany({
            tags: { $all: ["tag2", "tag3"] },
        });
        expect(users3.length).toBe(1);
    });

    test("$elemMatch operator", async () => {
        await Users.insertMany([
            {
                username: "User1",
                classes: [
                    { subject: "Math", gpa: 3.5 },
                    { subject: "Programming", gpa: 4 },
                ],
            },
            {
                username: "User2",
                classes: [
                    { subject: "Math", gpa: 3.0 },
                    { subject: "Programming", gpa: 3.8 },
                ],
            },
        ]);

        const users = await Users.findMany({
            classes: { $elemMatch: { subject: "Programming", gpa: 4 } },
        });
        expect(users.length).toBe(1);
        expect(users[0].username).toBe("User1");
    });

    test("Logical operators", async () => {
        await Users.insertMany([
            { username: "User1", age: 25, email: "user1@example.com" },
            { username: "User2", age: 30, email: "user2@example.com" },
            { username: "User3", age: 35, email: "user3@example.com" },
            { username: "User4", age: 25, email: "user4@example.com" },
        ]);

        const users = await Users.findMany({
            $or: [{ age: 25 }, { username: "User2" }],
        });
        expect(users.length).toBe(3);

        const users1 = await Users.findMany({
            $and: [{ age: 25 }, { username: "User1" }],
        });
        expect(users1.length).toBe(1);

        const users2 = await Users.findMany({
            $nor: [{ age: 25 }, { username: "User1" }],
        });
        expect(users2.length).toBe(2);

        const users3 = await Users.findMany({
            $and: [
                { $or: [{ age: 25 }, { username: "User2" }] },
                { email: "user4@example.com" },
            ],
        });
        expect(users3.length).toBe(1);
    });

    // UPDATE OPERATORS TESTS
    test("Update operators", async () => {
        await Users.insertOne({
            username: "Swordax",
            age: 25,
            tags: ["tag1", "tag2"],
        });

        await Users.updateOne({ username: "Swordax" }, { $inc: { age: 1 } });
        const updatedUser = await Users.findOne({ username: "Swordax" });
        expect(updatedUser.age).toBe(26);

        await Users.updateOne({ username: "Swordax" }, { $inc: { age: -1 } });
        const updatedUser1 = await Users.findOne({ username: "Swordax" });
        expect(updatedUser1.age).toBe(25);

        await Users.updateOne(
            { username: "Swordax" },
            { $push: { tags: "tag3" } }
        );
        const updatedUser2 = await Users.findOne({ username: "Swordax" });
        expect(updatedUser2.tags.length).toBe(3);
        expect(updatedUser2.tags[2]).toBe("tag3");

        await Users.updateOne(
            { username: "Swordax" },
            { $addToSet: { tags: "tag3" } }
        );
        const updatedUser3 = await Users.findOne({ username: "Swordax" });
        expect(updatedUser3.tags.length).toBe(3);
        expect(updatedUser3.tags[2]).toBe("tag3");

        await Users.updateOne(
            { username: "Swordax" },
            { $pull: { tags: "tag3" } }
        );
        const updatedUser4 = await Users.findOne({ username: "Swordax" });
        expect(updatedUser4.tags.length).toBe(2);
        expect(updatedUser4.tags[2]).toBeUndefined;
        expect(updatedUser4.tags[1]).toBe("tag2");

        await Users.updateOne({ username: "Swordax" }, { $pop: { tags: 1 } });
        const updatedUser5 = await Users.findOne({ username: "Swordax" });
        expect(updatedUser5.tags.length).toBe(1);
        expect(updatedUser5.tags[1]).toBeUndefined;
        expect(updatedUser5.tags[0]).toBe("tag1");

        await Users.updateOne(
            { username: "Swordax" },
            { $concat: { tags: ["tag2", "tag3"] } }
        );
        const updatedUser6 = await Users.findOne({ username: "Swordax" });
        expect(updatedUser6.tags.length).toBe(3);
        expect(updatedUser6.tags[2]).toBe("tag3");
    });
});
