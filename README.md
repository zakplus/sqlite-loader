# sqlite-loader
## A SQLite script loader for webpack

This loader parses a SQLite script and extracts the queries as a string array.

### Use cases:
SQLite queries for initial creation or updates of database schemas are better organized into script files than embedded into code. This loader lets you easily load them at compile time.

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

Otherwise, you can specify the loader directly in your import/require:

```javascript
import queries from 'sqlite-loader!./my-queries.sql'
```
```javascript
var queries = require('sqlite-loader!./my-queries.sql');
```

### Data structure:

The loader returns a javascript string array where each item is a SQLite query from the script file.  
The order of the queries is retained, index 0 points to the first query in the script file.

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

It will result in the following array:

```javascript
[
"CREATE TABLE test (id INTEGER, data TEXT);",
"INSERT INTO test (id,data) VALUES (1, 'one line');",
"INSERT INTO test (id,data) VALUES (2, 'two\nlines');"
];
```

## License
```
MIT License

Copyright (c) 2018 Valerio Bianchi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```