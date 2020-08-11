const test = require('ava')
const {resolve} = require('test-fixture')()
const fs = require('fs')
const {isFunction, isString} = require('core-util-is')
const {parse, stringify, assign} = require('..')

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
          isFunction(s)
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

test('#17: has trailing comma and comment after comma', t => {
  const str = `{
  "b": [
    1,
  ],
  "a": 1, // a
}`

  t.is(stringify(parse(str), null, 2), `{
  "b": [
    1
  ],
  "a": 1 // a
}`)
})

test('#17: insert key between a and b', t => {
  const str = `{
  "a": 1, // a
  "b": 2, // b
}`
  const parsed = parse(str)
  const obj = {}
  assign(obj, parsed, ['a'])
  obj.c = 3
  assign(obj, parsed, ['b'])

  t.is(stringify(obj, null, 2), `{
  "a": 1, // a
  "c": 3,
  "b": 2 // b
}`)
})

test('#22: stringify parsed primitive', t => {
  const CASES = [
    ['1 /* comment */', '1'],
    ['// comment\n1', '1'],
    ['true // comment', 'true'],
    ['"1" // comment', '"1"']
  ]

  for (const [str, str2] of CASES) {
    t.is(
      stringify(parse(str), null, 2),
      str,
      `${str} with space`
    )

    t.is(
      stringify(parse(str)),
      str2,
      `${str} with no space`
    )
  }
})
