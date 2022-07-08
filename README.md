# PotatoDB

<p align="center">
	<img width="100" src="./logo.png">
	<br>
	A node.js filesystem nosql database system.
	<br>
	By <a href="https://swordax.netlify.app">Swordax</a>
</p>

## About

PotatoDB is a local database system that can be used to store and manage data in JSON format in the local filesystem of node.js servers. PotatoDB is a NOSQL database system, it uses methods and functions to create and manage data.

## Features

1. Easy and simple to deal with
2. Wide range of control over data
3. Flexibility of querying data
4. Support for multiple databases

## How it works

PotatoDB creates a main databases directory. Every newly created database will result in creating a new directory inside the main databases directory. Every newly created farm (collection in NoSQL or table in SQL) will result in creating a new JSON file inside the relevant database directory. The JSON file will contain an array of objects, and every object of these objects represents a single potato (document in NoSQL or record in SQL).

## Installation

PotatoDB is available on [npm](https://www.npmjs.com/package/potatodb), all you need to do is run `npm install potatodb` to start using the library.

## Usage

#### Require

After installing PotatoDB via npm, require `setRoot` and `createDatabase` methods from the library.

```js
const { setRoot, createDatabase } = require("potatodb");
```

#### setRoot

The `setRoot()` method is used to define the location and the name of the databases directory, which will later host the databases. The method takes two arguments: first is the directory name `__dirname`, and second is the desired name of the databases directory (defaults to "databases").

```js
setRoot(__dirname, "databases");
```

#### createDatabase

The `createDatabase()` method creates a database directory inside the databases directory, where farms (collections) will be contained. PotatoDB allows you to have multiple databases at the same time, all stored inside the databases directory. The `createDatabase()` method takes two arguments: first is the name of the database, and second is a boolean that specifies whether the database should be cleared out and rewritten whenever the server restarts or not (default to `false`).

```js
const DB = createDatabase("WebDB", true);
```

#### DB.createFarm

The `createFarm()` method is a database method returned from the `createDatabase()` method, it allows you to create farms inside the database directory. Farms in PotatoDB are like collections in NoSQL databases or tables in SQL databases. This method takes two arguments: first is the name of the farm, and second is an options object.

```js
const Farm = DB.createFarm("Farm", {
    identifications: false,
    timestamps: false,
});
```

Available options:

-   `identifications`
    Speicifes whether the potatoes (documents in NoSQL or records in SQL) inside the farm should be stamped with identification strings or not.
-   `timestamps`
    Specifies whether the potatoes (document in NoSQL or records in SQL) inside the farm should be stamped with timestamps. Timestamps state when the potato was created and when it was lastly updated.

#### DB.dropDatabase

The `dropDatabase()` method is a database method returned from the `createDatabase()` method, it allows you to entirely drop/delete the database.

```js
DB.dropDatabase();
```

#### Farm.countPotatoes

The `countPotatoes()` method is a farm method returned from the `DB.createFarm()` method, it returns the precise number of potatoes in the farm. Potatoes in PotatoDB are like documents in NoSQL databases or records in SQL databases.

```js
await Farm.countPotatoes();
```

#### Farm.dropFarm

The `dropFarm()` method is a farm method returned from the `DB.createFarm()` method, it allows you to entirely drop/delete the farm from the database.

#### Farm.insertOne

The `insertOne()` method is a farm method used to insert a single potato into the farm. The method takes a single potato object as an argument, and returns the inserted object.

```js
await Farm.insertOne({ name: "Swordax", age: 1, isHuman: true });
```

#### Farm.insertMany

The `insertMany()` method is a farm method used to insert multiple potatoes into the farm. The method takes a single array of potato objects as an argument, and returns an array of the inserted objects.

```js
await Farm.insertMany([
    {
        name: "Vazox",
        age: 2,
        isHuman: false,
    },
    {
        name: "Alxa",
        age: 3,
        isHuman: true,
    },
]);
```

#### Farm.findOne

The `findOne()` method is a farm method used to find a single potato and return it. The method takes two arguments: first is a query object or a test function, and second is an options object. Both arguments are optional.

```js
const byName = await Farm.findOne({ name: "Swordax" });
const byNameAndAge = await Farm.findOne({ name: "Alxa", age: 3 });
```

Available options:

-   `skip`
    Specifies the amount of potatoes skipped before starting the search.

#### Farm.findMany

The `findMany()` method is a farm method used to find multiple potatoes and return them as an array. The method takes two arguments: first is a query object or a test function, and second is an options object. Both arguments are optional.

```js
const eighteen = await Farm.findMany({ age: 18 });
const eighteenOrOlder = await Farm.findMany((potato) => potato.age >= 18);
```

Available options:

-   `limit`
    Specifies the maximum amount of potatoes retrieved.
-   `skip`
    Specifies the amount of potatoes skipped before starting the search.

#### Farm.updateOne

The `updateOne()` method is a farm method used to update a single potato. The method takes three arguments: first is a query object or a test function, second is an updates object or an update function, and third is a boolean that specifies whether the method should return the updated version of the potato object or the pre-updated one (defaults to true which returns the updated version).

```js
await Farm.updateOne({ name: "Swordax" }, { age: 2 }, false);
```

#### Farm.updateMany

The `updateMany()` method is a farm method used to update mulitple potatoes. The method takes three arguments: first is a query object or a test function, second is an updates object or an update function, and third is a boolean that specifies whether the method should return the updated version of the potato objects or the pre-updated one (defaults to true which returns the updated version).

```js
await Farm.updateMany((potato) => potato.age >= 18, { authorized: false });
```

#### Farm.deleteOne

The `deleteOne()` method is a farm method used to delete a single potato. The method takes a single argument, which could be a query object or a test function. The method returns the deleted potato object.

```js
await Farm.deleteOne({ name: "Alxa" });
await Farm.deleteOne((potato) => potato.name === "Vazox");
```

#### Farm.deleteMany

The `deleteMany()` method is a farm method used to delete multiple potatoes. The method takes a single argument, which could be a query object or a test function. The method returns an array of the deleted potato objects.

```js
await Farm.deleteMany({ age: 0 });
await Farm.deleteMany((potato) => potato.age < 18);
```

#### Principles of Querying with PotatoDB

Finding, updating, and deleteing methods of PotatoDB farms all require querying to select the right potato to return or apply changes on. Querying with PotatoDB can be done in two ways, either by providing a query object, or by providing a test function to be used in querying.

-   A query object that selects potatoes with a username of "Swordax": `{ username: "Swordax" }`
-   A query object that selects potatoes with an age of 18: `{ age: 18 }`
-   A query object that selects potatoes with an isMarried property set to true: `{ isMarried: true }`

You can query nested properties by using string paths in the query object, nested property keys should be separated with dots.

The following example queries users that have the nested `building` field set to "Uptown Building":

```js
const data = await Users.findMany({
    "country.city.street.building": "Uptown Building",
});
```

The second way of querying data with PotatoDB is by using custom filtering test functions, as you can design your own test function to be used in querying data instead of a limited query object.

The following example queries users that have "Arabic" and "English" languages listed in their `languages` field:

```js
const data = await Users.findOne((user) => {
    return (
        user.languages.includes("English") && user.languages.includes("Arabic")
    );
});
```

#### Query Operators

PotatoDB provides query operators that can be used in query objects when querying data. Query operators can help you build flexible reachy query objects instead of having to build a custom test function.

The following example uses two of the query operators (`$gte` and `$lt`) to select users that are more than or equal to eighteen years old, and those who are less than eighteen years old:

```js
const eighteenOrOlder = await Users.findMany({ age: { $gte: 18 } });
const underEighteen = await Users.findMany({ age: { $lt: 18 } });
```

Valid Query Operators:
| Operator | JS Equivalent | Function |
|----------|--------------------------------------------------------|--------------------------------------------|
| $gt | > | Greater than |
| $gte | >= | Greater than or equal to |
| $lt | < | Less than |
| $lte | <= | Less than or equal to |
| $eq | === | Equal to |
| $eqv | == | Equal to value (regardless of data type) |
| $neq | !== | Not equal to |
| $neqv | != | Not equal to (regardless of data type) |
| $in | Array.prototype.includes() <br> String.prototype.includes() | Checks if array or string includes a value |

#### Principles of Updating with PotatoDB

Updating PotatoDB data can be done in two ways, either by providing an updates object, or by providing an updating function.

An updates object can be given new values to fields, fields previous values will be overwritten with the new given values. If fields don't exist, they will be created. Multiple fields can be updated at the same time by providing multiple key:value pairs in the updates object.

```js
await Users.updateOne({ name: "Swordax" }, { age: 2 });
await Users.updateOne({ name: "Alxa" }, { age: 0, isHuman: true });
```

Updating nested properties can be done by accessing these nested fields thorugh a string path in the update object. Key names should be separated with dots.

The following example access the `height` nested property and updates it's value:

```js
await Users.updateOne(
    { name: "Swordax" },
    { "physicalTraits.body.height": 184 }
);
```

Another way that can be used to update potatoes is update functions. Update functions are custom functions that can be designed to update the potatoes in any way you desire. Update functions give you more flexibility in updating potatoes rather than limiting the possiblities with update objects.

```js
await Users.updateOne({ username: "Swordax" }, (user) => {
    user.token = Math.floor(Math.random() * 11);
});
```

#### Update Operators

PotatoDB provides update operators that can be used inside update objects to give you more flexibility when updating fields. Update operators can give you shorthands to doing things you couldn't do unless you designed your own custom update function.

The following example uses the `$push` operator to push "Arabic" language into the languages array field:

```js
await Users.updateMany(
    { nationality: "Syria" },
    { languages: { $push: "Arabic" } }
);
```

Valid Update Operators:
| Operator | JS Equivalent | Function |
|----------|----------------------------------------------------|--------------------------------------------------|
| $inc | += -= | Increments/Decrements field by the given value |
| $push | Array.prototype.push() | Pushes a value into an array field |
| $concat | Array.prototype.concat() <br> String.prototype.concat() | Concatenates two arrays/strings together |
| $pull | | Removes all occurrences of a value from an array |

#### Full Example

The following code demonstrates the creation of an API that communicates with a PotatoDB database system, integrated with express.js

```js
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
let DB, Users;
(async () => {
    DB = await createDatabase("DB", false);
    Users = await DB.createFarm("Users", {
        identifications: true,
        timestamps: true,
    });
})();

// create user
app.post("/create/user", async (req, res) => {
    try {
        const user = await Users.insertOne(req.body);
        res.status(200).json({ success: true, userId: user._id });
    } catch (err) {
        res.status(400).json({ success: false, err });
        console.log(err);
    }
});

// get user
app.get("/get/user", async (req, res) => {
    try {
        const user = await Users.findOne({ username: req.body.username });
        res.status(200).json({ success: true, user });
    } catch (err) {
        res.status(400).json({ success: false, err });
        console.log(err);
    }
});
```

## Contact

Swordax Contacts:

-   discord: https://discord.com/users/465453058667839499/
-   discord id: Swordax#5756
-   email: swordax.sy@gmail.com
-   social media at: @swordax.sy
-   github: https://github.com/SwordaxSy
