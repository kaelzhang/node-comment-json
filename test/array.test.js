const test = require('ava')
const {isFunction} = require('core-util-is')
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
  ]
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

    expect(t, [...ret], stringify(parsed, null, 2), parsed, ret)
  })
})
