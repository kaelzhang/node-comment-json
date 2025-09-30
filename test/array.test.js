// eslint-disable-next-line import/no-unresolved
const test = require('ava')
const {
  parse, stringify, assign, CommentArray
} = require('..')

const st = o => stringify(o, null, 2)

const a1 = `[
  // 0
  0,
  // 1
  1,
  // 2
  2
]`

const a2 = `[
  // 1
  1,
  // 2
  2
]`

const a3 = `[
  // 0
  0
]`

const texpect = (
  t,
  // cleaned parsed
  ret,
  // stringified value from parsed
  str,
  // parsed value
  r,
  // real return value
  rr
) => {
  if (typeof ret === 'object' && ret !== null) {
    t.deepEqual(r, ret)
  } else {
    t.is(r, ret)
  }

  if (typeof rr === 'string') {
    t.is(rr, str)
  } else {
    t.is(st(rr), str)
  }
}

const slice = (ret, str) =>
  (t, r, _, __, rr) => texpect(t, ret, str, r, rr)

const unshift = (ret, str) =>
  (t, r, s) => texpect(t, ret, str, r, s)

const CASES = [
  [
    // title
    'splice(0, 1)',
    // input array
    a1,
    // run
    array => array.splice(0, 1),
    // expect function or expected value of the result array
    [0],
    // expected stringified string
    a2
  ],
  [
    'splice(0)',
    a1,
    array => array.splice(0),
    [0, 1, 2],
    '[]'
  ],
  [
    'splice(- 3, 1)',
    a1,
    array => array.splice(- 3, 1),
    [0],
    a2
  ],
  [
    '#16: splice(1, 0, 3)',
    a1,
    array => array.splice(1, 0, 3),
    [],
    `[
  // 0
  0,
  3,
  // 1
  1,
  // 2
  2
]`
  ],
  [
    'invalid: splice(0, undefined)',
    a1,
    array => array.splice(0, undefined),
    [],
    a1
  ],
  [
    'slice(0)',
    a1,
    array => array.slice(0),
    [0, 1, 2],
    a1
  ],
  [
    'slice(-1)',
    a1,
    array => array.slice(- 1),
    slice(
      // cleaned object after parsed and sliced
      [2],
      // parse, slice and then stringify
      `[
  // 2
  2
]`)
  ],
  [
    'slice(3)',
    a1,
    array => array.slice(3),
    slice([], '[]')
  ],
  [
    'slice(undefined, undefined)',
    a1,
    array => array.slice(),
    slice([0, 1, 2], a1)
  ],
  [
    'slice(0, - 2)',
    a1,
    array => array.slice(0, - 2),
    slice([0], a3)
  ],
  [
    'slice(0, 1)',
    a1,
    array => array.slice(0, 1),
    slice([0], a3)
  ],
  [
    'slice(0, 1), no mess',
    `[
  // 0
  0,
  1 // 1
]`,
    array => array.slice(0, 1),
    slice([0], `[
  // 0
  0
]`)
  ],
  [
    'unshift()',
    a1,
    array => array.unshift(),
    unshift(3, a1)
  ],
  [
    'unshift(- 1)',
    a1,
    array => array.unshift(- 1),
    unshift(4, `[
  -1,
  // 0
  0,
  // 1
  1,
  // 2
  2
]`)
  ],
  [
    'shift',
    a1,
    array => array.shift(),
    unshift(0, `[
  // 1
  1,
  // 2
  2
]`)
  ],
  [
    'shift, no mess',
    `[
  // 0
  0,
  1 /* 1 */,
  2 // 2
]`,
    array => array.shift(),
    unshift(0, `[
  1 /* 1 */,
  2 // 2
]`)
  ],
  [
    'reverse',
    a1,
    array => array.reverse(),
    unshift([2, 1, 0], `[
  // 2
  2,
  // 1
  1,
  // 0
  0
]`)
  ],
  [
    'reverse, no mess',
    `[
  0, // 0
  // 1
  1,
  // 2
  2
]`,
    array => array.reverse(),
    unshift([2, 1, 0], `[
  // 2
  2,
  // 1
  1,
  0 // 0
]`)
  ],
  [
    'pop',
    a1,
    array => array.pop(),
    unshift(2, `[
  // 0
  0,
  // 1
  1
]`)
  ],
  [
    'sort, default lex sort',
    `[
  // before c
  "c",
  "a", // after a
  "b" /* after b value */,
  "d"
]`,
    array => array.sort(),
    unshift(['a', 'b', 'c', 'd'], `[
  "a", // after a
  "b" /* after b value */,
  // before c
  "c",
  "d"
]`)
  ],
  [
    'sort, with `compareFunction`',
    `[
  // before c
  "c",
  "a", // after a
  "b" /* after b value */,
  // before d
  "d"
]`,
    array => {
      array.sort(
        (a, b) => a > b
          ? - 1
          : 1
      )
      return array
    },
    unshift(['d', 'c', 'b', 'a'], `[
  // before d
  "d",
  // before c
  "c",
  "b" /* after b value */,
  "a" // after a
]`)
  ],
]

CASES.forEach(([d, a, run, e, s]) => {
  test(d, t => {
    const parsed = parse(a)
    const ret = run(parsed)

    const expect = typeof e === 'function'
      ? e
      : (tt, r, str) => {
        tt.deepEqual(r, e)
        tt.is(str, s)
      }

    expect(
      t,
      // Cleaned return value
      Array.isArray(ret)
        // clean ret
        ? [...ret]
        : ret,
      // Stringified
      st(parsed),
      parsed,
      ret
    )
  })
})

test('assign', t => {
  const str = `{
  // a
  "a": 1,
  // b
  "b": 2
}`

  const parsed = parse(str)

  t.is(st(assign({}, parsed)), str)
  t.is(st(assign({})), '{}')

  t.is(st(assign({}, parsed, ['a', 'c'])), `{
  // a
  "a": 1
}`)

  t.throws(() => assign({}, parsed, false), {
    message: /keys/
  })
  t.throws(() => assign(), {
    message: /convert/
  })
})

test('concat', t => {
  const parsed1 = parse(`[
  // foo
  "foo"
]`)

  const parsed2 = parse(`[
  // bar
  "bar",
  // baz,
  "baz"
]`)

  const concated = parsed1.concat(
    parsed2,
    'qux'
  )

  t.is(stringify(concated, null, 2), `[
  // foo
  "foo",
  // bar
  "bar",
  // baz,
  "baz",
  "qux"
]`)

  t.is(stringify(new CommentArray().concat()), '[]')
})
