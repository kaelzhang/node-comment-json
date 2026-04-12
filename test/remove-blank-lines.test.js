// eslint-disable-next-line import/no-unresolved
const test = require('ava')

const {parse, stringify, removeBlankLines} = require('..')

test('removeBlankLines: should throw TypeError if target is not an object', t => {
  const error = t.throws(() => {
    removeBlankLines('not an object')
  }, {instanceOf: TypeError})

  t.is(error.message, 'target must be an object')
})

test('removeBlankLines: should remove blank lines recursively', t => {
  const obj = parse(`{
  // before foo

  "foo": {
    // before bar

    "bar": 1
  },

  "baz": [
    // before item

    1
  ]
}`)

  removeBlankLines(obj)

  t.is(stringify(obj, null, 2), `{
  // before foo
  "foo": {
    // before bar
    "bar": 1
  },
  "baz": [
    // before item
    1
  ]
}`)
})

test('removeBlankLines: should remove blank lines from a specific location', t => {
  const obj = parse(`{
  // before foo

  "foo": 1,

  "bar": 2
}`)

  removeBlankLines(obj, {where: 'before', key: 'foo'})

  t.is(stringify(obj, null, 2), `{
  // before foo
  "foo": 1,

  "bar": 2
}`)
})

test('removeBlankLines: should delete the location when only blank lines remain', t => {
  const obj = parse(`{
  "foo": 1,

  "bar": 2
}`)

  removeBlankLines(obj, {where: 'before', key: 'bar'})

  t.is(stringify(obj, null, 2), `{
  "foo": 1,
  "bar": 2
}`)
  t.false(Object.hasOwn(obj, Symbol.for('before:bar')))
})

test('removeBlankLines: should return early if the location does not exist', t => {
  const obj = {foo: 1}

  removeBlankLines(obj, {where: 'before', key: 'foo'})

  t.deepEqual(obj, {foo: 1})
})

test('removeBlankLines: should return early when location has no blank lines', t => {
  const obj = parse(`{
  // before foo
  "foo": 1
}`)

  removeBlankLines(obj, {where: 'before', key: 'foo'})

  t.is(stringify(obj, null, 2), `{
  // before foo
  "foo": 1
}`)
})

test('removeBlankLines: should ignore non-array comment slots', t => {
  const obj = {foo: 1}

  Object.defineProperty(obj, Symbol.for('before:foo'), {
    value: 'not-an-array',
    writable: true,
    configurable: true
  })

  removeBlankLines(obj, {where: 'before', key: 'foo'})

  t.is(obj[Symbol.for('before:foo')], 'not-an-array')
})

test('removeBlankLines: should ignore non-comment symbols during recursive cleanup', t => {
  const obj = parse(`{
  // before foo

  "foo": 1
}`)
  const marker = Symbol('marker')

  Object.defineProperty(obj, marker, {
    value: [{type: 'BlankLine', inline: false}],
    writable: true,
    configurable: true
  })

  removeBlankLines(obj)

  t.true(Object.hasOwn(obj, marker))
  t.deepEqual(obj[marker], [{type: 'BlankLine', inline: false}])
  t.is(stringify(obj, null, 2), `{
  // before foo
  "foo": 1
}`)
})
