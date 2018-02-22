class Parser {
  constructor() {
    this.reset();
  }

  reset() {
    this.parsingString = false;
    this.stringEnclosedBy = '';
    this.queries = [];
    this.query = '';
  }

  isInString() {
    // In SQLite quotes and double quotes escaping is obtained by doubling
    // them, backslash escaping type is not admitted.
    // http://www.sqlite.org/lang_expr.html

    return this.parsingString;
  }

  startString(chr) {
    this.parsingString = true;
    this.stringEnclosedBy = chr;
  }

  stopString() {
    this.parsingString = false;
    this.stringEnclosedBy = '';
  }

  // Append a character to current query
  appendToQuery(chr) {
    // Skip white spaces and line breaks character if not in a string
    if (this.isInString()) this.query += chr;

    // Not in a string
    else {
      let tChr = chr;
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

  confirmQuery() {
    if (this.query.length > 0) {
      this.queries.push(this.query);

      // Prepare for next query
      this.query = '';
    }
  }

  parse(sourceTxt) {
    this.reset();

    const source = sourceTxt.split('');
    const sourceSize = source.length;
    const lastSourceIndex = sourceSize - 1;

    let singleLineComment = false;
    let multiLineComment = false;

    for (let i = 0; i < sourceSize; i += 1) {
      const chr = source[i];
      const nextChr = i < lastSourceIndex ? source[i + 1] : null;

      // Check for end of single line comment (new line)
      // https://sqlite.org/lang_comment.html
      if (singleLineComment) {
        if (chr === '\n' || chr === '\r') {
          singleLineComment = false;
          this.appendToQuery(chr); // The line break character is not part of the comment itself
        }
      } else if (multiLineComment) {
        // Check for end of multiline comment (C-style)
        // https://sqlite.org/lang_comment.html
        if (chr === '*' && nextChr === '/') {
          multiLineComment = false;
          i += 1; // Skip next character
        }
      } else {
        // Not in a comment section

        // If not currently reading a string
        if (!this.isInString()) {
          // Check for start of single line comment (https://sqlite.org/lang_comment.html)
          if (chr === '-' && nextChr === '-') {
            if (!this.isInString()) {
              singleLineComment = true;
              i += 1; // Skip next character
            }
          } else if (chr === '/' && nextChr === '*') {
            // Check for start of multi line comment (https://sqlite.org/lang_comment.html)
            if (!this.isInString()) {
              multiLineComment = true;
              i += 1; // Skip next character
            }
          } else if (chr === '"' || chr === "'") {
            // Check for string start
            this.startString(chr);
          }
        } else if (chr === this.stringEnclosedBy) {
          // If currently reading a string then check for string end

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
}

function generateSourceCode(queries) {
  let src = 'module.exports = [\n';

  for (let i = 0; i < queries.length; i += 1) {
    const query = queries[i];

    let escaped = query.replace(/\\/mg, '\\\\');
    escaped = escaped.replace(/\r/mg, '\\r');
    escaped = escaped.replace(/\n/mg, '\\n');
    escaped = escaped.replace(/"/mg, '\\"');

    if (i > 0) src += ',\n';
    src += `"${escaped}"`;
  }

  src += '\n];';
  return src;
}

module.exports = function sqliteLoader(source) {
  this.cacheable = true;

  // Find queries in source text
  const parser = new Parser();
  const queries = parser.parse(source);

  // Emit a warning if no queries was found
  if (queries.length === 0) {
    this.emitWarning(`No queries found in ${this.resourcePath}`);
  }

  return generateSourceCode(queries);
};
