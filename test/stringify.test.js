const test = require('ava')
const {resolve} = require('test-fixture')()
const fs = require('fs')
const {isFunction, isString} = require('core-util-is')
const {parse, stringify} = require('../src')

const SUBJECTS = [
  'abc',
  1,
  true,
  false,
  null,
  undefined,
  [],
  {},
  {a: 1, b: null},
  ['abc', 1, {a: 1, b: undefined}],
  [undefined, 1, 'abc'],
  {
    a: undefined,
    b: false,
    c: [1, '1'],
    d: 'bar'
  }
]

const REPLACERS = [
  // null,
  (key, value) => {
    if (typeof value === 'string') {
      return undefined
    }

    return value
  }
]

const SPACES = [
  1,
  2,
  '  ',
  '1'
]

const each = (subjects, replacers, spaces, iterator) => {
  subjects.forEach(subject => {
    replacers.forEach(replacer => {
      spaces.forEach(space => {
        const desc = [subject, replacer, space]
        .map(s =>
          isFunction(s)
            ? 'replacer'
            : JSON.stringify(s)
        )
        .join(', ')

        iterator(subject, replacer, space, desc)
      })
    })
  })
}

// each(SUBJECTS, REPLACERS, SPACES, (subject, replacer, space, desc) => {
//   test(`stringify: ${desc}`, t => {
//     const compare = [
//       JSON.stringify(subject, replacer, space),
//       stringify(subject, replacer, space)
//     ]

//     // console.log(compare)

//     t.is(...compare)
//   })
// })

const OLD_CASES = [
  'deep',
  'duplex',
  'indent',
  'simple',
  'single-right',
  'single-top'
]

OLD_CASES.forEach(name => {
  [
    '  ',
    2,
    3,
    null
  ].forEach(space => {
    const s = isString(space)
      ? space.length
      : space

    test(`${name}, space: ${s} (${space})`, t => {
      const file = resolve(`${name}-null-${s}.json`)

      const content = fs.readFileSync(file).toString().trim()
      const parsed = parse(content)
      const str = stringify(parsed, null, space)

      t.is(str, content)
    })
  })
})
