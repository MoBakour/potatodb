const { setRoot, createDatabase } = require("./index.js");

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
        expect(users.length).toBeGreaterThan(0);
    });

    test("Find and sort documents", async () => {
        await Users.insertMany([
            { username: "User1", age: 30 },
            { username: "User2", age: 25 },
        ]);
        const sortedUsers = await Users.findMany({}, { sort: { age: -1 } });
        expect(sortedUsers[0].age).toBeGreaterThan(sortedUsers[1].age);
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
        const user = await Users.insertOne({
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
});
