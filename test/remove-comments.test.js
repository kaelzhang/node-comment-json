// eslint-disable-next-line import/no-unresolved
const test = require('ava')

const {parse, stringify, removeComments} = require('..')

test('removeComments: should throw TypeError if target is not an object', t => {
  const error = t.throws(() => {
    removeComments('not an object', {where: 'before'})
  }, {instanceOf: TypeError})

  t.is(error.message, 'target must be an object')
})

test('removeComments: should throw TypeError if target is null', t => {
  const error = t.throws(() => {
    removeComments(null, {where: 'before'})
  }, {instanceOf: TypeError})

  t.is(error.message, 'target must be an object')
})

test('removeComments: should remove property-specific comments', t => {
  const obj = parse(`{
    // before foo
    "foo": 1 // after foo
  }`)

  removeComments(obj, {where: 'before', key: 'foo'})

  const result = stringify(obj, null, 2)
  t.false(result.includes('// before foo'))
  t.true(result.includes('// after foo'))
})

test('removeComments: should remove non-property comments', t => {
  const obj = parse(`// top comment
{
  "foo": 1
}`)

  removeComments(obj, {where: 'before-all'})

  const result = stringify(obj, null, 2)
  t.false(result.includes('// top comment'))
})

test('removeComments: should return early if comment does not exist', t => {
  const obj = {foo: 1}

  // Should not throw error
  removeComments(obj, {where: 'before', key: 'foo'})

  t.deepEqual(obj, {foo: 1})
})

test('removeComments: should handle different comment types', t => {
  const obj = parse(`{
    "foo": /* block comment */ 1
  }`)

  removeComments(obj, {where: 'after-colon', key: 'foo'})

  const result = stringify(obj, null, 2)
  t.false(result.includes('/* block comment */'))
})

test('removeComments: should throw RangeError for invalid where with key', t => {
  const obj = {foo: 1}

  const error = t.throws(() => {
    removeComments(obj, {where: 'before-all', key: 'foo'})
  }, {instanceOf: RangeError})

  t.is(error.message, 'Unsupported comment position before-all with key foo')
})

test('removeComments: should throw RangeError for invalid where without key', t => {
  const obj = {foo: 1}

  const error = t.throws(() => {
    removeComments(obj, {where: 'invalid-position'})
  }, {instanceOf: RangeError})

  t.is(error.message, 'Unsupported comment position invalid-position')
})

test('removeComments: should handle after-prop comments', t => {
  const obj = parse(`{
    "foo" /* after prop comment */: 1
  }`)

  removeComments(obj, {where: 'after-prop', key: 'foo'})

  const result = stringify(obj, null, 2)
  t.false(result.includes('/* after prop comment */'))
})

test('removeComments: should handle after-value comments', t => {
  const obj = parse(`{
    "foo": 1 /* after value comment */,
    "bar": 2
  }`)

  removeComments(obj, {where: 'after-value', key: 'foo'})

  const result = stringify(obj, null, 2)
  t.false(result.includes('/* after value comment */'))
  t.true(result.includes('"bar": 2'))
})

test('removeComments: should handle after comments', t => {
  const obj = parse(`{
    "foo": 1, // after comment
    "bar": 2
  }`)

  removeComments(obj, {where: 'after', key: 'foo'})

  const result = stringify(obj, null, 2)
  t.false(result.includes('// after comment'))
  t.true(result.includes('"bar": 2'))
})

test('removeComments: should handle after-all comments', t => {
  const obj = parse(`{
  "foo": 1
}
// bottom comment`)

  removeComments(obj, {where: 'after-all'})

  const result = stringify(obj, null, 2)
  t.false(result.includes('// bottom comment'))
})

test('removeComments: should handle multiple comment removal', t => {
  const obj = parse(`// top comment
{
  // before foo
  "foo": 1, // after foo
  // before bar
  "bar": 2 // after bar
}
// bottom comment`)

  // Remove multiple comments
  removeComments(obj, {where: 'before-all'})
  removeComments(obj, {where: 'before', key: 'foo'})
  removeComments(obj, {where: 'after', key: 'bar'})
  removeComments(obj, {where: 'after-all'})

  const result = stringify(obj, null, 2)
  t.false(result.includes('// top comment'))
  t.false(result.includes('// before foo'))
  t.false(result.includes('// after bar'))
  t.false(result.includes('// bottom comment'))
  t.true(result.includes('// after foo'))
  t.true(result.includes('// before bar'))
})
