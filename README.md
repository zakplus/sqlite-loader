# sqlite-loader
## A SQLite script loader for webpack 1.x and webpack 2.x.

This loader parses a SQLite script and extract the queries as a string array.

### Use cases:
SQLite queries for initial creation or updates of database schemas are better organized into script files then embedded into code. This loader let you easily load then at compile time.

### Installation:

```
npm install --save-dev sqlite-loader
```

### Configuration:

You can declare the loader in the webpack configuration file and just import/require the script file in your code:

```javascript
// webpack-config.js
module.exports = {
  module: {
    loaders: [
      // SQLite script loader
      { test: /\.sql$/, loader: "sqlite-loader" }
    ]
  }
}
```
```javascript
import queries from './my-queries.sql'
```
```javascript
var queries = require('./my-queries.sql');
```

Otherwise you can specify the loader directly in your import / require:

```javascript
import queries from 'sqlite-loader!./my-queries.sql'
```
```javascript
var queries = require('sqlite-loader!./my-queries.sql');
```

### Data structure

The loader return a javascript string array in which each item is a SQLite query read from the script file.

#### Example:

```sql
/*
  SQLite script
  example.
*/

-- Create a test table
CREATE TABLE test (id INTEGER, data TEXT);

-- Now the data
INSERT INTO test (id,data) VALUES (1, 'one line');

-- With line breaks
INSERT INTO test (id,data)
VALUES (2, 'two
lines');
```

Will results in the following array:

```javascript
[
"CREATE TABLE test (id INTEGER, data TEXT);",
"INSERT INTO test (id,data) VALUES (1, 'one line');",
"INSERT INTO test (id,data) VALUES (2, 'two\
lines');"
];
```
