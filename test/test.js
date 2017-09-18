const assert = require('assert');
const loader = require('../build');

// Build a fake webpack module function.
// Use the loader to generate the module code then execute it and return the results.
function load(source) {
  let env = {};
  const moduleCode = loader.call(env, source);
  const moduleFunction = new Function(['module', 'exports', 'require'], moduleCode);
  let fakeModule = {exports: {}}
  moduleFunction(fakeModule, fakeModule.exports, require);
  return fakeModule.exports;
}

describe('sqlite-loader', () => {
  let queries = undefined;
  
  it('should generate valid module code', () => {
    queries = load("\
      create table t1 (id INTEGER, value, TEXT);\
      create table t2 (id INTEGER, value, TEXT);\
      insert into t1 (id, value) values (1, 'hello\
      world');\
    ");
  })

  it('should return a array', () => {
    assert.equal(true, queries instanceof Array);
  });

  it('should return 3 queries with this sample code', () => {
    assert.strictEqual(queries.length, 3);
  });
});
