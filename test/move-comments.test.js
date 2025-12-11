// eslint-disable-next-line import/no-unresolved
const test = require('ava')

const {parse, stringify, moveComments} = require('..')

test('moveComments: should throw TypeError if source is not an object', t => {
  const error = t.throws(() => {
    moveComments('not an object', {}, {kind: 'before'}, {kind: 'after'})
  }, {instanceOf: TypeError})

  t.is(error.message, 'source must be an object')
})

test('moveComments: should throw TypeError if source is null', t => {
  const error = t.throws(() => {
    moveComments(null, {}, {kind: 'before'}, {kind: 'after'})
  }, {instanceOf: TypeError})

  t.is(error.message, 'source must be an object')
})

test('moveComments: should throw TypeError if source is primitive', t => {
  const error = t.throws(() => {
    moveComments(123, {}, {kind: 'before'}, {kind: 'after'})
  }, {instanceOf: TypeError})

  t.is(error.message, 'source must be an object')
})

test('moveComments: should use source as target when target is not provided', t => {
  const source = parse(`{
    "foo": 1 // comment
  }`)

  // Call moveComments without target parameter
  moveComments(source, null,
    {kind: 'after', key: 'foo'},
    {kind: 'before', key: 'foo'}
  )

  const result = stringify(source, null, 2)
  t.true(result.includes('// comment'))
  t.true(result.includes('"foo": 1'))
})

test('moveComments: should use source as target when target is undefined', t => {
  const source = parse(`{
    "foo": 1 // comment
  }`)

  // Call moveComments with undefined target
  moveComments(source, undefined,
    {kind: 'after', key: 'foo'},
    {kind: 'before', key: 'foo'}
  )

  const result = stringify(source, null, 2)
  t.true(result.includes('// comment'))
  t.true(result.includes('"foo": 1'))
})

test('moveComments: should return early if target is not an object after assignment', t => {
  const source = parse(`{
    "foo": 1 // comment
  }`)

  // This should return early and not throw
  moveComments(source, 'not an object',
    {kind: 'after-value', key: 'foo'},
    {kind: 'before', key: 'foo'}
  )

  // Source should be unchanged
  const result = stringify(source, null, 2)
  t.true(result.includes('// comment'))
})

test('moveComments: should return early if target is null', t => {
  const source = parse(`{
    "foo": 1 // comment
  }`)

  // This should return early and not throw
  moveComments(source, null,
    {kind: 'after', key: 'foo'},
    {kind: 'before', key: 'foo'}
  )

  // Source should have moved comments (because target defaults to source)
  const result = stringify(source, null, 2)
  t.true(result.includes('// comment'))
})

test('moveComments: should return early if source does not have the from property', t => {
  const source = {foo: 1}
  const target = {bar: 2}

  // Try to move non-existent comment
  moveComments(source, target,
    {kind: 'after', key: 'foo'},
    {kind: 'before', key: 'bar'}
  )

  // Target should be unchanged
  t.deepEqual(target, {bar: 2})
})

test('moveComments: should move comments and override existing ones when override is true', t => {
  const source = parse(`{
    "foo": 1 // source comment
  }`)

  const target = parse(`{
    // existing comment
    "bar": 2
  }`)

  moveComments(source, target,
    {kind: 'after', key: 'foo'},
    {kind: 'before', key: 'bar'},
    true // override = true
  )

  const result = stringify(target, null, 2)
  t.true(result.includes('// source comment'))
  t.false(result.includes('// existing comment'))
})

test('moveComments: should move comments to empty target location', t => {
  const source = parse(`{
    "foo": 1 // source comment
  }`)

  const target = {bar: 2}

  moveComments(source, target,
    {kind: 'after', key: 'foo'},
    {kind: 'before', key: 'bar'}
  )

  const result = stringify(target, null, 2)
  t.true(result.includes('// source comment'))
})

test('moveComments: should append comments when target has existing comments and override is false', t => {
  const source = parse(`{
    "foo": 1 // source comment
  }`)

  const target = parse(`{
    // existing comment
    "bar": 2
  }`)

  moveComments(source, target,
    {kind: 'after', key: 'foo'},
    {kind: 'before', key: 'bar'},
    false // override = false (default)
  )

  const result = stringify(target, null, 2)
  t.true(result.includes('// existing comment'))
  t.true(result.includes('// source comment'))
})

test('moveComments: should handle non-property comments (before-all)', t => {
  const source = parse(`// top comment
{
  "foo": 1
}`)

  const target = {bar: 2}

  moveComments(source, target,
    {kind: 'before-all'},
    {kind: 'after-all'}
  )

  const result = stringify(target, null, 2)
  t.true(result.includes('// top comment'))
})

test('moveComments: should handle property-specific comments with keys', t => {
  const source = parse(`{
    "foo" /* after-prop */: 1
  }`)

  moveComments(source, source,
    {kind: 'after-prop', key: 'foo'},
    {kind: 'before', key: 'foo'}
  )

  const result = stringify(source, null, 2)
  t.true(result.includes('/* after-prop */'))
})

test('moveComments: should handle case where target_comments is null/undefined', t => {
  const source = parse(`{
    "foo": 1 // comment
  }`)

  const target = {}
  // Manually create a symbol property with null value to test line 304
  const targetSymbol = Symbol.for('before:bar')
  Object.defineProperty(target, targetSymbol, {
    value: null,
    writable: true,
    configurable: true
  })

  moveComments(source, target,
    {kind: 'after', key: 'foo'},
    {kind: 'before', key: 'bar'}
  )

  // Should not throw error even if target_comments is null
  // This tests the condition on line 304: if (target_comments)
  t.pass()
})

test('moveComments: should delete source comment after moving', t => {
  const source = parse(`{
    "foo": 1 // comment to move
  }`)

  const target = {bar: 2}

  moveComments(source, target,
    {kind: 'after', key: 'foo'},
    {kind: 'before', key: 'bar'}
  )

  // Source should no longer have the comment
  const sourceResult = stringify(source, null, 2)
  t.false(sourceResult.includes('// comment to move'))

  // Target should have the comment
  const targetResult = stringify(target, null, 2)
  t.true(targetResult.includes('// comment to move'))
})

test('moveComments: should work with different comment types', t => {
  const source = parse(`{
    "foo": /* block comment */ 1
  }`)

  moveComments(source, source,
    {kind: 'after-prop', key: 'foo'},
    {kind: 'after', key: 'foo'}
  )

  const result = stringify(source, null, 2)
  t.true(result.includes('/* block comment */'))
})

test('moveComments: integration test with multiple moves', t => {
  const obj = parse(`{
    // before foo
    "foo": 1, // after foo
    // before bar
    "bar": 2 // after bar
  }`)

  // Move all comments to after-all
  moveComments(obj, obj, {kind: 'before', key: 'foo'}, {kind: 'after-all'})
  moveComments(obj, obj, {kind: 'after', key: 'foo'}, {kind: 'after-all'})
  moveComments(obj, obj, {kind: 'before', key: 'bar'}, {kind: 'after-all'})
  moveComments(obj, obj, {kind: 'after', key: 'bar'}, {kind: 'after-all'})

  const result = stringify(obj, null, 2)

  // Check that comments were moved (should appear at the end with space formatting)
  t.true(result.includes('before foo'))
  t.true(result.includes('after foo'))
  t.true(result.includes('before bar'))
  t.true(result.includes('after bar'))

  // Verify that the after-all symbol exists and has comments
  const afterAllSymbol = Symbol.for('after-all')
  t.true(Object.hasOwn(obj, afterAllSymbol))
  t.is(obj[afterAllSymbol].length, 4)
})
