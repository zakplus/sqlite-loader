'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Parser = function () {
  function Parser() {
    _classCallCheck(this, Parser);

    this.reset();
  }

  _createClass(Parser, [{
    key: 'reset',
    value: function reset() {
      this.parsingString = false;
      this.stringEnclosedBy = '';
      this.queries = [];
      this.query = '';
    }
  }, {
    key: 'isInString',
    value: function isInString() {
      // In SQLite quotes and double quotes escaping is obtained by doubling
      // them, backslash escaping type is not admitted.
      // http://www.sqlite.org/lang_expr.html

      return this.parsingString;
    }
  }, {
    key: 'startString',
    value: function startString(chr) {
      this.parsingString = true;
      this.stringEnclosedBy = chr;
    }
  }, {
    key: 'stopString',
    value: function stopString() {
      this.parsingString = false;
      this.stringEnclosedBy = '';
    }

    // Append a character to current query

  }, {
    key: 'appendToQuery',
    value: function appendToQuery(chr) {
      // Skip white spaces and line breaks character if not in a string
      if (this.isInString()) this.query += chr;

      // Not in a string
      else {
          var tChr = chr;
          // Transform blank spaces in simple spaces
          if (chr === ' ' || chr === '\t' || chr === '\r' || chr === '\n') tChr = ' ';

          // If current character is not a space, just append it to the query
          if (tChr !== ' ') this.query += tChr;

          // Avoid double spaces outside of strings
          else if (this.query.length > 0 && this.query.slice(-1) !== tChr) {
              this.query += tChr;
            }
        }
    }
  }, {
    key: 'confirmQuery',
    value: function confirmQuery() {
      if (this.query.length > 0) {
        this.queries.push(this.query);

        // Prepare for next query
        this.query = '';
      }
    }
  }, {
    key: 'parse',
    value: function parse(sourceTxt) {
      this.reset();

      var source = sourceTxt.split('');
      var sourceSize = source.length;
      var lastSourceIndex = sourceSize - 1;

      var singleLineComment = false;
      var multiLineComment = false;

      for (var i = 0; i < sourceSize; i += 1) {
        var chr = source[i];
        var nextChr = i < lastSourceIndex ? source[i + 1] : null;

        // Check for end of single line comment (new line)
        // https://sqlite.org/lang_comment.html
        if (singleLineComment) {
          if (chr === '\n' || chr === '\r') {
            singleLineComment = false;
            this.appendToQuery(chr); // The line break character is not part of the comment itself
          }
        }

        // Check for end of multiline comment (C-style)
        // https://sqlite.org/lang_comment.html
        else if (multiLineComment) {
            if (chr === '*' && nextChr === '/') {
              multiLineComment = false;
              i += 1; // Skip next character
            }
          }

          // Not in a comment section
          else {
              // If not currently reading a string
              if (!this.isInString()) {
                // Check for start of single line comment (https://sqlite.org/lang_comment.html)
                if (chr === '-' && nextChr === '-') {
                  if (!this.isInString()) {
                    singleLineComment = true;
                    i += 1; // Skip next character
                  }
                }

                // Check for start of multi line comment (https://sqlite.org/lang_comment.html)
                else if (chr === '/' && nextChr === '*') {
                    if (!this.isInString()) {
                      multiLineComment = true;
                      i += 1; // Skip next character
                    }
                  }

                  // Check for string start
                  else if (chr === '"' || chr === "'") {
                      this.startString(chr);
                    }
              }

              // If currently reading a string then check for string end
              else if (chr === this.stringEnclosedBy) {
                  // Check if not escaped
                  if (nextChr !== this.stringEnclosedBy) {
                    this.stopString();
                  }
                }

              if (!singleLineComment && !multiLineComment) {
                // Not in a comment section

                // Append character to current query
                this.appendToQuery(chr);

                // Semicolon ends current query if not in a string
                if (chr === ';' && !this.isInString()) {
                  this.confirmQuery();
                }
              }
            }
      }

      return this.queries;
    }
  }]);

  return Parser;
}();

function generateSourceCode(queries) {
  var src = 'module.exports = [\n';

  for (var i = 0; i < queries.length; i += 1) {
    var query = queries[i];

    var escaped = query.replace(/\\/mg, '\\\\');
    escaped = escaped.replace(/(\r?\n)/mg, '\\$1');
    escaped = escaped.replace(/"/mg, '\\"');

    if (i > 0) src += ',\n';
    src += '"' + escaped + '"';
  }

  src += '\n];';
  return src;
}

module.exports = function sqliteLoader(source) {
  this.cacheable = true;

  // Find queries in source text
  var parser = new Parser();
  var queries = parser.parse(source);

  // Emit a warning if no queries was found
  if (queries.length === 0) {
    this.emitWarning('No queries found in ' + this.resourcePath);
  }

  return generateSourceCode(queries);
};