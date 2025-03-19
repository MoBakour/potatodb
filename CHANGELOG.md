# Updates History

## [0.0.1-dev] - 2022-7-12

-   Initial release

## [0.0.2-dev] - 2024-5-4

-   Improved PotatoId constructor function
-   Added query operators
-   Extended query operators capabilities
-   Extended update operators capabilities
-   Improved code

## [0.0.3-dev] - 2024-5-5

-   Fixed bug in find methods
-   Improved sorting mechanism
-   Added addToSet array query operator
-   Maintained and added more JSDoc documentation
-   Fixed documentation

## [0.0.4-dev] - 2024-5-6

-   Added logical query operators
-   Added $elemMatch query operator
-   Added result projection

## [1.0.1] - 2024-5-16

-   Published v1 to npm

## [1.0.2] - 2024-5-16

-   Fixed issues in package metadata

## [1.0.3] - 2024-5-16

-   Fixed issues in package metadata

## [1.0.4] - 2024-7-4

-   Fixed a bug in query logic

## [1.1.0] - 2025-3-19

-   Added typescript support
-   Added support for regular expressions in queries
-   Added Farm.sampleOne, Farm.sampleMany, and Farm.sampleManyUnique for random sampling
-   Added Farm.exists() for checking resource existence
-   Added populating option to operations
-   Added support for sorting updateMany and deleteMany results
-   Added $pop array update operator
-   Added nested select capability
-   Enhanced error handling
-   Enhanced type support and documentation with JSDocs
-   findOne, updateOne, and deleteOne operations now return null instead of undefined if no document was found or affected
-   Renamed project option to select
-   Renamed identification to \_id
-   Made timestamps off by default
-   Default root will be the current working directory (process.cwd()) of the project rather than the directory of the file where setRoot was called
-   setRoot accepts an options object with rootPath and rootName fields rather than two separate arguments
-   setRoot is no longer required, but will be available for customization
-   Fixed error that pops up when trying to update an inexistent document with updateOne method
