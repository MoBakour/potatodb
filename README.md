# PotatoDB

<p align="center">
	<img width="100" src="./logo.png">
	<br>
	A nodejs filesystem json database system.
	<br>
	By <a href="https://linkedin.com/in/mobakour">MoBakour</a>
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

After installing PotatoDB via npm, require `setRoot` and `createDatabase` functions from the library.

```js
const { setRoot, createDatabase } = require("potatodb");
```

or with ES6 import statement

```js
import { setRoot, createDatabase } from "potatodb";
```

#### setRoot

The `setRoot()` function is used to define the location and the name of the databases directory, which will later host the databases. This function is not required, as the root is automatically set with default options when the first database is created with [createDatabase](#createdatabase).

The function takes an options argument.

```js
setRoot({
  rootPath: process.cwd(),
  rootName: "databases",
});
```

Available options:

- `rootPath`:
  The path to the root directory of where the databases will be stored. Default to the current working directory returned by `process.cwd()`.
- `rootName`:
  The name of the directory that will be created to host the databases. Default to "databases".

#### createDatabase

The `createDatabase()` function creates a database inside the databases directory, where farms (collections) will be contained. PotatoDB allows you to have multiple databases at the same time, all stored inside the databases directory. The `createDatabase()` function takes two arguments: first is the name of the database, and second is an options object.

```js
const DB = createDatabase("MyDatabase", {
  overwrite: false,
});
```

Available options:

- `overwrite`
  Specifies whether the database should be cleared out and rewritten whenever the server restarts or not. (defaults to `false`)

#### DB.dropDatabase

The `dropDatabase()` method is a database method returned from the `createDatabase()` method, it allows you to entirely drop/delete the database.

```js
DB.dropDatabase();
```

#### DB.createFarm

The `createFarm()` method is a database method returned from the `createDatabase()` method, it allows you to create farms inside the database directory. Farms in PotatoDB are like collections in NoSQL databases or tables in SQL databases. This method takes two arguments: first is the name of the farm, and second is an options object.

```js
const Farm = DB.createFarm("Farm", {
  _id: true,
  timestamps: false,
});
```

Available options:

- `_id`
  Specifies whether the potatoes (documents in NoSQL or records in SQL) inside the farm should be stamped with identification strings or not. (defaults to true)
- `timestamps`
  Specifies whether the potatoes (document in NoSQL or records in SQL) inside the farm should be stamped with timestamps (createdAt and updatedAt). Timestamps contain numerical timestamps that point to the time when the potato object was first created and lastly updated. (defaults to false)

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

Both `findOne()` and `findMany()` methods accept a second options object.

```js
const results = await Farm.findMany(queryObject, optionsObject);
```

Learn about [Query Options](#query-options)

#### Farm.updateOne

The `updateOne()` method is a farm method used to update a single potato. The method takes three arguments: first is a query object or a test function, second is an updates object or an update function, and third is an options object.

```js
await Farm.updateOne({ name: "Swordax" }, { age: 2 }, { updated: true });
```

#### Farm.updateMany

The `updateMany()` method is a farm method used to update multiple potatoes. The method takes three arguments: first is a query object or a test function, second is an updates object or an update function, and third is an options object.

```js
await Farm.updateMany((potato) => potato.age >= 18, { authorized: false });
```

In the above example, the `updateMany()` method took a query test function instead of a query object. The query function filters for potatoes which have the age property greater than or equal to 18.

#### Update Methods Options

Both `updateOne()` and `updateMany()` methods accept a third options object.

```js
await Farm.updateOne(queryObject, updateObject, optionsObject);
```

Learn about [Query Options](#query-options)

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

```js
await Farm.deleteOne(queryObject, optionsObject);
```

Learn about [Query Options](#query-options)

#### Farm.sampleOne

The `sampleOne()` method is a farm method used to obtain a single random sample potato from the farm.

```js
const randomDocument = await Farm.sampleOne();
```

#### Farm.sampleMany

The `sampleMany()` method is a farm method used to obtain a number of random sample potatoes from the farm. The method requires a single `count` argument to specify the number of required samples.

Note that this method may return duplicate potato documents.

```js
const randomDocuments = await Farm.sampleMany(5);
```

#### Farm.sampleManyUnique

The `sampleManyUnique()` method is a farm method used to obtain a number of random sample potatoes from the farm. The method requires a single `count` argument to specify the number of required samples.

This method differs from the `Farm.sampleMany` method by that it will not return duplicate potato documents, and may return a smaller number of documents than specified if no sufficient unique documents were found.

```js
const randomUniqueDocuments = await Farm.sampleManyUnique(5);
```

#### Farm.exists

The `exists()` method is a farm method that takes a query object or a test function and returns a boolean value that specified whether a potato document that passes the given test exists or not. This method uses `Farm.findOne()` method under the hood, so expect a similar querying behavior.

```js
const exists = await Users.exists({ email: "example@mail.com" });
```

#### Farm.countPotatoes

The `countPotatoes()` method is an asynchronous farm method returned from the `DB.createFarm()` method, it returns the precise number of potato objects in the farm.

```js
await Farm.countPotatoes();
```

The `countPotatoes()` method can take a query object or a test function to test against potatoes (documents) and count the ones that pass the test.

```js
await Farm.countPotatoes({ active: true });
// returns the precise count of the active documents
```

#### Query Options

These options allow you to customize query behavior when retrieving, updating, or deleting potatoes in the database.

| **Option**     | **Type**               | **Description**                                                                                                                                                                | **Available In**                                                                        |
| -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **`limit`**    | `number`               | Sets the maximum number of potatoes to return. Accepts negative values to start from the end of the array.                                                                     | `findMany()`                                                                            |
| **`skip`**     | `number`               | Skips a specified number of potatoes before processing the query.                                                                                                              | `findOne()`, `findMany()`                                                               |
| **`recent`**   | `boolean`              | If `true`, prioritizes recent potatoes in the search. By default, data is processed from oldest to newest.                                                                     | `findOne()`, `findMany()`                                                               |
| **`sort`**     | `object` \| `function` | Defines sorting behavior. Can be an object where keys are field names and values specify sorting order (`1` for ascending, `-1` for descending), or a custom sorting function. | `findMany()`, `updateMany()`, `deleteMany()`                                            |
| **`select`**   | `object`               | Specifies fields to include or exclude in the result. See the [Selection](#selection) section for details.                                                                     | `findOne()`, `findMany()`, `updateOne()`, `updateMany()`, `deleteOne()`, `deleteMany()` |
| **`populate`** | `object`               | Defines reference fields to populate. See the [Population](#population) section for details.                                                                                   | `findOne()`, `findMany()`, `updateOne()`, `updateMany()`, `deleteOne()`, `deleteMany()` |
| **`updated`**  | `boolean`              | Determines whether the returned result is the post-update or pre-update version. Defaults to `true`, returning the updated data.                                               | `updateOne()`, `updateMany()`                                                           |

#### Principles of Querying with PotatoDB

Finding, updating, and deleting methods of PotatoDB farms all require querying to select potatoes to return or apply changes on. Querying with PotatoDB can be done in two ways: First is object querying by providing a query object. Second is functional querying by providing a test function to be used in querying. PotatoDB supports regular expressions in query objects as well.

- `{ username: "Swordax" }` - A query object that selects potatoes with a username of "Swordax"
- `{ age: 18 }` - A query object that selects potatoes with an age of 18
- `{ isMarried: true }` - A query object that selects potatoes with an isMarried property set to true
- `{ name: /^A/ }` - A query object that selects potatoes with a `name` that starts with the letter "A" using a regular expression.

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

PotatoDB provides query operators that can be used in query objects when querying data. Query operators can help you build flexible query objects instead of having to build a custom test function.

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

Updating nested properties can be done by accessing these nested fields through a string path in the update object. Key names should be separated with dots.

The following example access the `height` nested property and updates it's value:

```js
await Users.updateOne(
  { name: "Swordax" },
  { "physicalTraits.body.height": 184 }
);
```

Another way that can be used to update potatoes is update functions. Update functions are custom functions that can be designed to update the potatoes in any way you desire. Update functions give you more flexibility in updating potatoes rather than limiting the possibilities with update objects.

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

| Operator    | JS Equivalent                                               | Function                                                                  |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `$inc`      | `+=` or `-=`                                                | Increments/Decrements field by the given value                            |
| `$push`     | `Array.prototype.push()`                                    | Pushes a value into an array field                                        |
| `$addToSet` | `Set.prototype.add()`                                       | Pushes a value into an array field only if it doesn't already exist in it |
| `$pull`     |                                                             | Removes all occurrences of a value from an array                          |
| `$pop`      | `Array.prototype.pop()` <br> `Array.prototype.shift()`      | Removes the first or the last item from an array                          |
| `$concat`   | `Array.prototype.concat()` <br> `String.prototype.concat()` | Concatenates two arrays/strings together                                  |

#### Selection

PotatoDB allows you to perform selection to your query and operations results, which is selecting what fields to include/exclude in the returned result from the operation method. Select option is available for all find, update, and delete methods in their options object. The option is called `select` and it takes a selection object.

A selection object takes field names as keys, and zeros or ones as values. Fields flagged with 0 will be excluded while the rest will be included. Fields flagged with 1 will be included while the rest will be excluded. Note that you can't flag fields with zeros and ones at the same time in the same selection object, it's either zeros or ones.

```js
const users_with_ids_and_names_and_ages = await Users.findMany(
  {},
  {
    select: {
      _id: 1, // will include _id field in results
      name: 1, // will include name field in results
      age: 1, // will include age field in results
    }, // all other fields will be excluded from the results
  }
);

const users_without_timestamps = await Users.findMany(
  {},
  {
    select: {
      createdAt: 0, // will exclude createdAt field in results
      updatedAt: 0, // will exclude updatedAt field in results
    },
  } // all other fields will be included in the results
);
```

You can also select nested or populated fields

```js
const posts_with_users = await Posts.findMany(
  {},
  {
    populate: {
      owner: User,
    },
    select: {
      owner: {
        password: 0,
      },
    },
  }
);
```

#### Population

PotatoDB allows referencing fields from other farms by referring to them with their `_id` number. When getting the parent document, you can populate the referenced field with the actual document using the `populate` option available in find, update, and delete methods options.

To populate a referenced field, you should pass the `populate` option an object with key:value properties. The key represents the field name that contains the reference, and the value should be the farm instance that holds the referenced document.

Note that it is possible to reference and populate multiple fields at once.

Example demonstrating how to use referencing and populating in PotatoDB:

```js
// create farms
const Users = DB.createFarm("Users");
const Posts = DB.createFarm("Posts");

// create user potato (document)
const user = await Users.insertOne({ username: "Swordax" });

// create post potato and reference the owner
const post = await Posts.insertOne({
  owner: user._id,
  title: "Post Title",
  text: "This is interesting!",
});

// find post potato and populate owner field
const retrievedPost = await Posts.findOne(
  { _id: post._id },
  {
    populate: {
      owner: Users,
    },
  }
);
```

#### Usage with TypeScript

PotatoDB supports TypeScript. You can pass an interface that describes the structure of your farm as a generic when creating the farm.

```ts
interface IUser {
  username: string;
  email: string;
  password: string;
  level: number;
}

const Users = await DB.createFarm<IUser>("Users");
```

Note that you do not need to specify `_id`, `createdAt`, or `updatedAt` in the farm interface. PotatoDB takes care of these if `_id` and `timestamps` were set to true in farm options.

#### Full Example with Express

The following code demonstrates the creation of an API that communicates with a PotatoDB database system, integrated with express.js

```js
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
const DB = createDatabase("DB", {
  overwrite: false,
});

const farmOptions = {
  _id: true,
  timestamps: true,
};

const Users = DB.createFarm("Users", farmOptions);
const Posts = DB.createFarm("Posts", farmOptions);

// listen to server requests
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

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
```

## Contact

My Contacts:

- email: mo.bakour@outlook.com
- website: https://bakour.dev
- linkedin: https://linkedin.com/in/mobakour
- github: https://github.com/MoBakour
- discord: https://discord.com/users/465453058667839499/
