// eslint-disable-next-line import/no-unresolved
const test = require('ava')
const {resolve} = require('test-fixture')()
const fs = require('fs')
const {isFunction, isString} = require('core-util-is')

const {parse, stringify} = require('..')
const {
  set_comment_line_breaks
} = require('../src/common')

const normalize_blank_lines = subject => subject.replace(/\n[ \t]+\n/g, '\n\n')

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
          isFunction(s)
            ? 'replacer'
            : JSON.stringify(s, replacer)
        )
        .join(', ')

        iterator(subject, replacer, space, desc,
          // prevent title duplication
          `${i}+${ii}+${iii}`)
      })
    })
  })
}

const run = (subjects, replacers, spaces) => {
  each(subjects, replacers, spaces, (subject, replacer, space, desc, i) => {
    test(`${i}: stringify: ${desc}`, t => {
      const compare = [
        JSON.stringify(subject, replacer, space),
        stringify(subject, replacer, space)
      ]

      t.is(...compare)
    })
  })
}

run(SUBJECTS, REPLACERS, SPACES)

const SUBJECTS_WITH_BIGINT = [
  BigInt(9007199254740993),
  9007199254740993n,
  {
    a: 9007199254740993n
  },
  [9007199254740993n]
]

run(SUBJECTS_WITH_BIGINT, [
  (key, value) => {
    if (typeof value === 'bigint') {
      return JSON.rawJSON(String(value))
    }

    return value
  }
], SPACES)

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

test('preserve blank lines between array items with comments', t => {
  const content = `{
  "extends": [
    // base config
    "base",

    // node config
    "node"
  ]
}`

  const parsed = parse(content)
  const output = stringify(parsed, null, 2)

  t.is(normalize_blank_lines(output), normalize_blank_lines(content))
})

test('preserve blank lines between commented items with trailing commas', t => {
  const input = `{
  "foo": [
    // bar
    "bar",

    // baz
    "baz",
  ],
}`

  const expected = `{
  "foo": [
    // bar
    "bar",

    // baz
    "baz"
  ]
}`

  const parsed = parse(input)
  const output = stringify(parsed, null, 2)

  t.is(normalize_blank_lines(output), normalize_blank_lines(expected))
})

test('preserve blank lines after before comments', t => {
  const content = `{
  // before a

  "a": 1
}`

  const parsed = parse(content)
  const output = stringify(parsed, null, 2)

  t.is(normalize_blank_lines(output), normalize_blank_lines(content))
})

test('fallback to loc line breaks if internal metadata is missing', t => {
  const comments = [
    {
      type: 'LineComment',
      value: ' first',
      inline: false,
      loc: {
        start: {
          line: 2,
          column: 2
        },
        end: {
          line: 2,
          column: 10
        }
      }
    },
    {
      type: 'LineComment',
      value: ' second',
      inline: false,
      loc: {
        start: {
          line: 4,
          column: 2
        },
        end: {
          line: 4,
          column: 11
        }
      }
    }
  ]

  const obj = {
    a: 1
  }

  Object.defineProperty(obj, Symbol.for('before:a'), {
    value: comments,
    writable: true,
    configurable: true
  })

  const output = stringify(obj, null, 2)

  t.true(output.includes('// first\n  \n  // second'))
})

test('fallback to default spacing if loc is malformed', t => {
  const comments = [
    {
      type: 'LineComment',
      value: ' first',
      inline: false,
      loc: {
        start: {
          line: 2,
          column: 2
        },
        end: {
          line: 2,
          column: 10
        }
      }
    },
    {
      type: 'LineComment',
      value: ' second',
      inline: false,
      loc: {
        start: {},
        end: {}
      }
    }
  ]

  const obj = {
    a: 1
  }

  Object.defineProperty(obj, Symbol.for('before:a'), {
    value: comments,
    writable: true,
    configurable: true
  })

  const output = stringify(obj, null, 2)

  t.true(output.includes('// first\n  // second'))
})

test('fallback to inline spacing if no metadata and no loc', t => {
  const comments = [
    {
      type: 'LineComment',
      value: ' first',
      inline: false,
      loc: {
        start: {
          line: 2,
          column: 2
        },
        end: {
          line: 2,
          column: 10
        }
      }
    },
    {
      type: 'BlockComment',
      value: ' second ',
      inline: true
    }
  ]

  const obj = {
    a: 1
  }

  Object.defineProperty(obj, Symbol.for('before:a'), {
    value: comments,
    writable: true,
    configurable: true
  })

  const output = stringify(obj, null, 2)

  t.true(output.includes('// first /* second */'))
})

test('fallback when loc line order is invalid', t => {
  const comments = [
    {
      type: 'LineComment',
      value: ' first',
      inline: false,
      loc: {
        start: {
          line: 3,
          column: 2
        },
        end: {
          line: 3,
          column: 10
        }
      }
    },
    {
      type: 'LineComment',
      value: ' second',
      inline: false,
      loc: {
        start: {
          line: 2,
          column: 2
        },
        end: {
          line: 2,
          column: 11
        }
      }
    }
  ]

  const obj = {
    a: 1
  }

  Object.defineProperty(obj, Symbol.for('before:a'), {
    value: comments,
    writable: true,
    configurable: true
  })

  const output = stringify(obj, null, 2)

  t.true(output.includes('// first\n  // second'))
})

test('handles zero line-break metadata for first and non-first comments', t => {
  const comments = [
    {
      type: 'LineComment',
      value: ' first',
      inline: false
    },
    {
      type: 'LineComment',
      value: ' second',
      inline: false
    }
  ]

  set_comment_line_breaks(comments[0], 0)
  set_comment_line_breaks(comments[1], 0)

  const obj = {
    a: 1
  }

  Object.defineProperty(obj, Symbol.for('before-all'), {
    value: comments,
    writable: true,
    configurable: true
  })

  const output = stringify(obj, null, 2)

  t.true(output.startsWith('// first\n// second\n{'))
})
