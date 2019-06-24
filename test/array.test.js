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

const CASES = [
  [
    'splice',
    a1,
    array => array.splice(0, 1),
    (t, ret, str) => {
      t.deepEqual(ret, [0])
      t.is(str, `[
  // 1
  1,
  // 2
  2
]`)
    }
  ]
]

CASES.forEach(([d, a, run, expect]) => {
  test(d, t => {
    const parsed = parse(a)
    const ret = run(parsed)

    expect(t, [...ret], stringify(parsed, null, 2), parsed, ret)
  })
})
