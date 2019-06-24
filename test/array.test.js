const test = require('ava')
const {
  isFunction, isObject, isString, isArray
} = require('core-util-is')
const {parse, stringify} = require('../src')

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

// ret: return value to expect
const texpect = (t, ret, str, r, rr) => {
  if (isObject(ret)) {
    t.deepEqual(r, ret)
  } else {
    t.is(r, ret)
  }

  if (isString(rr)) {
    t.is(rr, str)
  } else {
    t.is(stringify(rr, null, 2), str)
  }
}

const slice = (ret, str) =>
  (t, r, _, __, rr) => texpect(t, ret, str, r, rr)

const unshift = (ret, str) =>
  (t, r, s) => texpect(t, ret, str, r, s)

const CASES = [
  [
    'splice(0, 1)',
    a1,
    array => array.splice(0, 1),
    [0],
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
    slice([2], `[
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
//   [
//     'reverse',
//     a1,
//     array => array.reverse(),
//     unshift([2, 1, 0], `[
//   // 2
//   2,
//   // 1
//   1,
//   // 0
//   0
// ]`)
//   ]
]

CASES.forEach(([d, a, run, e, s]) => {
  test(d, t => {
    const parsed = parse(a)
    const ret = run(parsed)

    const expect = isFunction(e)
      ? e
      : (tt, r, str) => {
        tt.deepEqual(r, e)
        tt.is(str, s)
      }

    expect(
      t,
      isArray(ret)
        // clean ret
        ? [...ret]
        : ret,
      stringify(parsed, null, 2), parsed, ret)
  })
})
