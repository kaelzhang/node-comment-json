// eslint-disable-next-line import/no-unresolved
const test = require('ava')
const {resolve} = require('test-fixture')()
const fs = require('fs')
const {isString} = require('core-util-is')

const {parse, stringify} = require('..')

const SUBJECTS = [
  'abc',
  '\u00ad\u0600',
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
    d: 'bar',
    e: {
      f: 2
    }
  },
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  {
    toJSON () {
      return {
        foo: 1
      }
    }
  },
  '"',
  {
    foo: '"',
    bar: '\b'
  }
]

const REPLACERS = [
  null,
  ['a'],
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
  subjects.forEach((subject, i) => {
    replacers.forEach((replacer, ii) => {
      spaces.forEach((space, iii) => {
        const desc = [subject, replacer, space]
        .map(s =>
          typeof s === 'function'
            ? 'replacer'
            : JSON.stringify(s)
        )
        .join(', ')

        iterator(subject, replacer, space, desc,
          // prevent title duplication
          `${i}+${ii}+${iii}`)
      })
    })
  })
}

each(SUBJECTS, REPLACERS, SPACES, (subject, replacer, space, desc, i) => {
  test(`${i}: stringify: ${desc}`, t => {
    const compare = [
      JSON.stringify(subject, replacer, space),
      stringify(subject, replacer, space)
    ]

    t.is(...compare)
  })
})

const OLD_CASES = [
  'block-comment',
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

    const filename = resolve(`${name}-null-${s}.json`)

    test(`${name}, space: ${s} (${space}): ${filename}`, t => {
      const file = resolve(filename)
      const content = fs.readFileSync(file).toString().trim()
      const parsed = parse(content)

      const str = stringify(parsed, null, space)

      t.is(str, content)
    })
  })
})
