# PotatoDB

<p align="center">
	<img width="100" src="./logo.png">
	<br>
	A nodejs filesystem json database system.
	<br>
	By <a href="https://linkedin.com/in/mohbakour">Mohamed Bakour</a>
</p>

## About

PotatoDB is a nodejs filesystem json database system that can be used to store and manage data in JSON format in the local filesystem of servers running in the Node.js environment.

## Features

1. Easy and simple to use and setup
2. Wide range of control over data
3. Flexibility of querying and updating data

## How it works

PotatoDB creates a main databases directory. Every newly created database will result in creating a new directory inside the main databases directory. Every newly created farm (collection in NoSQL or table in SQL) will result in creating a new JSON file inside the relevant database directory. The JSON file will contain an array of objects, and every object of these objects represents a single potato (document in NoSQL or record in SQL).

## Installation

```
npm install potatodb
```

## Usage

#### Require

After installing PotatoDB via npm, require `setRoot` and `createDatabase` methods from the library.

```js
const { setRoot, createDatabase } = require("potatodb");
```

or with ES6 import statement

```js
import { setRoot, createDatabase } from "potatodb";
```

#### setRoot

The `setRoot()` method is used to define the location and the name of the databases directory, which will later host the databases. The method takes two arguments: first is the directory name `__dirname`, and second is the desired name of the databases directory (defaults to "databases").

```js
setRoot(__dirname, "databases");
```

#### createDatabase

The `createDatabase()` method creates a database inside the databases directory, where farms (collections) will be contained. PotatoDB allows you to have multiple databases at the same time, all stored inside the databases directory. The `createDatabase()` method takes two arguments: first is the name of the database, and second is a boolean that specifies whether the database should be cleared out and rewritten whenever the server restarts or not (defaults to `false`).

```js
const DB = createDatabase("MyDatabase", false);
```

#### DB.dropDatabase

The `dropDatabase()` method is a database method returned from the `createDatabase()` method, it allows you to entirely drop/delete the database.

```js
DB.dropDatabase();
```

#### DB.createFarm

The `createFarm()` method is a database method returned from the `createDatabase()` method, it allows you to create farms inside the database directory. Farms in PotatoDB are like collections in NoSQL databases or tables in SQL databases. This method takes two arguments: first is the name of the farm, and second is an options object.

```js
const Farm = DB.createFarm("Farm", {
	identifications: true,
	timestamps: true,
});
```

Available options:

-   `identifications`
    Speicifes whether the potatoes (documents in NoSQL or records in SQL) inside the farm should be stamped with identification strings or not. (defaults to true)
-   `timestamps`
    Specifies whether the potatoes (document in NoSQL or records in SQL) inside the farm should be stamped with timestamps (createdAt and updatedAt). Timestamps contain numerical timestamps that point to the time when the potato object was first created and lastly updated. (defaults to true)

#### Farm.countPotatoes

The `countPotatoes()` method is an asynchronous farm method returned from the `DB.createFarm()` method, it returns the precise number of potato objects in the farm.

```js
await Farm.countPotatoes();
```

#### Farm.dropFarm

The `dropFarm()` method is a farm method returned from the `DB.createFarm()` method, it allows you to entirely drop/delete the farm from the database.

```js
Farm.dropFarm();
```

#### Farm.insertOne

The `insertOne()` method is a farm method used to insert a single potato into the farm. The method takes a single potato object as an argument, and returns the inserted object.
If identifications and timestamps were set on, then the returned potato object will include them.

```js
await Farm.insertOne({ name: "Swordax", age: 1, isHuman: true });
```

#### Farm.insertMany

The `insertMany()` method is a farm method used to insert multiple potatoes into the farm. The method takes a single array of potato objects as an argument, and returns an array of the inserted objects.
If identifications and timestamps were set on, then the returned potato objects will include them.

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
If no arguments were provided, or if an empty query object was provided, then the method would return the first potato object it would encounter.

```js
const byName = await Farm.findOne({ name: "Swordax" });
const byNameAndAge = await Farm.findOne({ name: "Alxa", age: 3 });
```

#### Farm.findMany

The `findMany()` method is a farm method used to find multiple potatoes and return them as an array. The method takes two arguments: first is a query object or a test function, and second is an options object. Both arguments are optional.
If no arguments were provided, or if an empty query object was provided, then the method would return all potatoes from the farm.

```js
const eighteen = await Farm.findMany({ age: 18 });
const eighteenOrOlder = await Farm.findMany((potato) => potato.age >= 18);
```

#### Find Methods Options

Both `findOne()` and `findMany()` methods could take a second options object.

Available options:

-   `limit` : (number) Specifies the maximum number of potatoes to return.
-   `skip` : (number) Specifies the number of potatoes to skip before starting the search.
-   `recent`: (boolean) Specifies whether priority of search should be to recent potatoes. By default, data is traversed oldest to recent.
-   `sort`: (object) An object that specifies the field to sort based on, and the value of that field would specify the order of sorting (positive number for ascending, negative number for descending).
-   `project`: (object) An object that specifies fields to include/exclude from returned result.

limit and sort options would make sense to be used with the `findMany()` method.

Example with options:

```js
const data = await UsersFarm.findMany(
	{},
	{
		recent: true, // begin searching with most recent data
		limit: 10, // return maximum of 10 results
		skip: 5, // skip 5 potatoes before beginning the search
		sort: {
			age: 1, // sort according to the age field in an ascending order
		},
		project: {
			password: 0, // 0 means exclude
			sensitiveInformation: 0,
		},
	}
);
```

#### Farm.updateOne

The `updateOne()` method is a farm method used to update a single potato. The method takes three arguments: first is a query object or a test function, second is an updates object or an update function, and third is an options object.

```js
await Farm.updateOne({ name: "Swordax" }, { age: 2 }, { updated: true });
```

#### Farm.updateMany

The `updateMany()` method is a farm method used to update mulitple potatoes. The method takes three arguments: first is a query object or a test function, second is an updates object or an update function, and third is an options object.

```js
await Farm.updateMany((potato) => potato.age >= 18, { authorized: false });
```

In the above example, the `updateMany()` method took a query test function instead of a query object. The query function filters for potatoes which have the age property greater than or equal to 18.

#### Update Methods Options

Both `updateOne()` and `updateMany()` methods could take a third options object.

Available options:

-   `updated`: (boolean) Specifies whether the returned result is the post-update or the pre-update version (defaults to true which returns the updated data).
-   `project`: (object) An object that specifies fields to include/exclude from returned result.

#### Farm.deleteOne

The `deleteOne()` method is a farm method used to delete a single potato. The method takes two arguments: first is a query object or a test function, second is an options object. The method returns the deleted potato object.

```js
await Farm.deleteOne({ name: "Alxa" });
await Farm.deleteOne((potato) => potato.name === "Vazox");
```

#### Farm.deleteMany

The `deleteMany()` method is a farm method used to delete multiple potatoes. The method takes two arguments: first is a query object or a test function, second is an options object. The method returns an array of the deleted potato objects.

```js
await Farm.deleteMany({ age: 0 });
await Farm.deleteMany((potato) => potato.age < 18);
```

#### Delete Methods Options

Both `deleteOne()` and `deleteMany()` methods could take a second options object.

Available options:

-   `project`: (object) An object that specifies fields to include/exclude from returned result.

#### Principles of Querying with PotatoDB

Finding, updating, and deleteing methods of PotatoDB farms all require querying to select potatoes to return or apply changes on. Querying with PotatoDB can be done in two ways: First is object querying by providing a query object. Second is functional querying by providing a test function to be used in querying.

-   A query object that selects potatoes with a username of "Swordax": `{ username: "Swordax" }`
-   A query object that selects potatoes with an age of 18: `{ age: 18 }`
-   A query object that selects potatoes with an isMarried property set to true: `{ isMarried: true }`

You can query nested properties by using string paths in the query object, nested property keys should be separated with dots.

The following example queries users that have the nested `building` field set to "Uptown Building" in a dataset that has the following signature:

```js
{
    name: string,
    age: number,
    country: {
        city: {
            street: {
                building: string
            }
        }
    }
}
```

```js
const data = await Users.findMany({
	"country.city.street.building": "Uptown Building",
});
```

The second way of querying data with PotatoDB is functional querying by using custom filtering test functions. You can design your own test function to be used in querying data instead of a limited query object. The test function takes a potato as an argument and it should return true or false depending on whether the argument passes the test or not.

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

##### Comparison Query Operators

| Operator | JS Equivalent | Function                                 |
| -------- | ------------- | ---------------------------------------- |
| $gt      | >             | Greater than                             |
| $gte     | >=            | Greater than or equal to                 |
| $lt      | <             | Less than                                |
| $lte     | <=            | Less than or equal to                    |
| $eq      | ===           | Equal to                                 |
| $eqv     | ==            | Equal to value (regardless of data type) |
| $neq     | !==           | Not equal to                             |
| $neqv    | !=            | Not equal to (regardless of data type)   |

##### Logical Query Operators

| Operator | JS Equivalent                        | Function               |
| -------- | ------------------------------------ | ---------------------- |
| $and     | &&                                   | All queries must pass  |
| $or      | \|\|                                 | Some queries must pass |
| $nor     | queries.every(query => !test(query)) | No queries must pass   |

`$and`:

```js
// both provided queries should pass to select the potato object
const users = await Users.findMany({
	$and: [{ authenticated: true }, { verified: true }],
});

// the above is equivalent to this:
const users = await Users.findMany({
	authenticated: true,
	verified: true,
});
```

the `$and` operator may seem to be useless at first, as the query can be done without it. But it's strength comes with nesting logical operators to make more powerful queries.

`$or`:

```js
// at least one of the provided queries should pass to select the potato object
const users = await Users.findMany({
	$or: [{ name: "Swordax" }, { name: "Vazox" }],
});
```

`$nor`:

```js
// none of the provided queries should pass to select the potato object
const users = await Users.findMany({
	$nor: [{ deactivated: true }, { blocked: true }],
});
```

You could nest logical operators to create powerful queries:

```js
const users = await Users.findMany({
	$or: [
		{ $and: [queryObject_1, queryObject_2] },
		{ $and: [queryObject_3, queryObject_4] },
		{ $nor: [queryObject_5, queryObject_6] },
	],
});
```

##### Array Query Operators

Array query operators (\$in, \$nin, \$all, and \$elemMatch) can be used in different scenarios.

Given dataset with the following signature:

```js
{
    name: string,
    age: number,
    hobbies: string[],
    classes: [{
        subject: string,
        gpa: number
    }]
}
```

`$in`:

```js
// gets users that have "Coding" inside their hobbies array
await Users.findMany({ hobbies: { $in: "Coding" } });

// gets users that are from the ages, 19, 20, and 21
await Users.findMany({ age: { $in: [19, 20, 21] } });

// gets users that have either "Coding" or "Swimming" inside their hobbies array
await Users.findMany({ hobbies: { $in: ["Coding", "Swimming"] } });
```

`$nin`:

```js
// gets users that DO NOT have "Coding" inside their hobbies array
await Users.findMany({ hobbies: { $nin: "Coding" } });

// gets users that are NOT from the ages, 19, 20, and 21
await Users.findMany({ age: { $nin: [19, 20, 21] } });

// gets users that DO NOT have "Coding" and "Swimming" inside their hobbies array
await Users.findMany({ hobbies: { $nin: ["Coding", "Swimming"] } });
```

`$all`:

```js
// gets users that have both "Coding" and "Swimming" inside their hobbies array
await Users.findMany({ hobbies: { $all: ["Coding", "Swimming"] } });
```

`$elemMatch`:

```js
// gets users that have the exact subdocument {subject:"Programming", gpa:4}
// inside their classes array field
await Users.findMany({
	classes: { $elemMatch: { subject: "Programming", gpa: 4 } },
});
```

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
	{ $push: { languages: "Arabic" } }
);
```

You could also push to multiple array fields:

```js
await Users.updateMany(
	{ nationality: "Syria" },
	{
		$push: {
			languages: "Arabic",
			hobbies: "Dabka Dance",
		},
	}
);
```

You could use multiple update operators at the same time:

```js
await Users.updateMany(
	{ nationality: "Syria" },
	{
		$push: {
			languages: "Arabic",
		},
		$inc: {
			age: 1,
		},
	}
);
```

##### Update Operators:

| Operator  | JS Equivalent                                           | Function                                                                  |
| --------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| $inc      | += -=                                                   | Increments/Decrements field by the given value                            |
| $push     | Array.prototype.push()                                  | Pushes a value into an array field                                        |
| $addToSet | Set.prototype.add()                                     | Pushes a value into an array field only if it doesn't already exist in it |
| $pull     |                                                         | Removes all occurrences of a value from an array                          |
| $concat   | Array.prototype.concat() <br> String.prototype.concat() | Concatenates two arrays/strings together                                  |

#### Projection

PotatoDB allows you to perform projection to your query and operations results. Projecting is selecting what fields to include/exclude in the returned result from the operation method. Projection option is available for all find, update, and delete methods in their options object. The option is called `project` and it takes a projection object.

A projection object takes field names as keys, and zeros or ones as values. Fields flagged with 0 will be excluded while the rest will be included. Fields flagged with 1 will be included while the rest will be excluded. Note that you can't flag fields with zeros and ones at the same time in the same projection object, it's either zeros or ones.

```js
const users_with_ids_and_names_and_ages = await Users.findMany(
	{},
	{
		project: {
			_id: 1, // will include _id field in results
			name: 1, // will include name field in results
			age: 1, // will include age field in results
		}, // all other fields will be excluded from the results
	}
);

const users_without_timestamps = await Users.findMany(
	{},
	{
		project: {
			createdAt: 0, // will exclude createdAt field in results
			updatedAt: 0, // will exclude updatedAt field in results
		},
	} // all other fields will be included in the results
);
```

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
		console.log(err);
		res.status(400).json({ success: false, error: err.message });
	}
});

// get user
app.get("/get-user", async (req, res) => {
	try {
		const user = await Users.findOne({ username: req.body.username });
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

		const users = await Users.findMany(
			{},
			{
				skip: resultsPerPage * (req.params.pageNumber - 1),
				limit: resultsPerPage,
				recent: true,
				sort: {
					"personalInformation.age": 1,
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
			true // get post-updated user object
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
		const deletedUser = await User.deleteOne({ _id: req.params.userId });
		res.status(200).json({ success: true, deletedUser });
	} catch (err) {
		console.log(err);
		res.status(400).json({ success: false, error: err.message });
	}
});
```

## Contact

My Contacts:

-   email: moh.bakour@outlook.com
-   linkedin: https://linkedin.com/in/mohbakour
-   github: https://github.com/MohBakour
-   linktr.ee: https://linktr.ee/swordax
-   discord: https://discord.com/users/465453058667839499/
-   discord username: swordax
