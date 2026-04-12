// eslint-disable-next-line import/no-unresolved
const test = require('ava')
const {resolve} = require('test-fixture')()
const fs = require('fs')

const {parse, stringify} = require('..')
const {
  set_raw_string_literal,
  get_raw_string_literal
} = require('../src/common')

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
    const s = typeof space === 'string'
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

  t.is(output, content)
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

  t.is(output, expected)
})

test('preserve blank lines after before comments', t => {
  const content = `{
  // before a

  "a": 1
}`

  const parsed = parse(content)
  const output = stringify(parsed, null, 2)

  t.is(output, content)
})

test('render explicit BlankLine tokens between comments', t => {
  const comments = [
    {
      type: 'LineComment',
      value: ' first',
      inline: false
    },
    {
      type: 'BlankLine',
      inline: false
    },
    {
      type: 'LineComment',
      value: ' second',
      inline: false
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

  t.is(output, `{
  // first

  // second
  "a": 1
}`)
})

test('render blank-line-only slots without indentation whitespace', t => {
  const comments = [
    {
      type: 'BlankLine',
      inline: false
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

  t.is(output, `{

  "a": 1
}`)
})

test('render explicit BlankLine tokens before closing brackets', t => {
  const comments = [
    {
      type: 'BlankLine',
      inline: false
    }
  ]

  const obj = {a: 1}

  Object.defineProperty(obj, Symbol.for('after'), {
    value: comments,
    writable: true,
    configurable: true
  })

  const output = stringify(obj, null, 2)

  t.is(output, `{
  "a": 1

}`)
})

test('render explicit BlankLine tokens mixed with inline comments', t => {
  const comments = [
    {
      type: 'BlockComment',
      value: ' first ',
      inline: true
    },
    {
      type: 'BlankLine',
      inline: false
    }
  ]

  const obj = {
    a: 1,
    b: 2
  }

  Object.defineProperty(obj, Symbol.for('after:a'), {
    value: comments,
    writable: true,
    configurable: true
  })

  const output = stringify(obj, null, 2)

  t.is(output, `{
  "a": 1, /* first */

  "b": 2
}`)
})

test('escape control characters same as JSON.stringify', t => {
  for (let i = 0; i <= 0x1f; i ++) {
    const char = String.fromCharCode(i)
    t.is(stringify(char, null, 2), JSON.stringify(char, null, 2))
  }
})

test('escape vertical tab as unicode', t => {
  t.is(JSON.stringify('\x0B', null, 4), '"\\u000b"')
  t.is(stringify('\x0B', null, 4), '"\\u000b"')
})

test('#29, stringify should keep problematic unicode as escapes in workspace-like JSONC', t => {
  const input = `{
  "settings": {
    "highlight-bad-chars.additionalUnicodeChars": [
      "\\u0008", // BACKSPACE
      "\\u3000", // IDEOGRAPHIC SPACE
      "\\u00A0", // NO-BREAK SPACE
      "\\u200E", // LEFT-TO-RIGHT MARK
      "\\u200F", // RIGHT-TO-LEFT MARK
      "\\u309A", // 半濁点
      "\\u3099" // 濁点
    ]
  }
}`

  const output = stringify(parse(input), null, 2)

  const expectedEscapes = [
    '\\u0008',
    '\\u3000',
    '\\u00A0',
    '\\u200E',
    '\\u200F',
    '\\u309A',
    '\\u3099'
  ]

  expectedEscapes.forEach(escape => {
    t.true(output.includes(`"${escape}"`))
  })
})

test('stringify should fallback to native escaping when string value changed', t => {
  const parsed = parse('{"a":"\\\\u00A0"}')

  parsed.a = '\x0B'

  t.is(stringify(parsed, null, 2), `{
  "a": "\\u000b"
}`)
})

test('raw string literal helpers should ignore invalid host and key', t => {
  set_raw_string_literal(null, 'a', '"foo"')
  set_raw_string_literal({}, null, '"foo"')
  set_raw_string_literal({}, 'a', null)

  t.is(get_raw_string_literal(null, 'a'), undefined)
  t.is(get_raw_string_literal({}, null), undefined)

  const holder = {}
  set_raw_string_literal(holder, 0, '"bar"')

  t.is(get_raw_string_literal(holder, 0), '"bar"')
  t.is(get_raw_string_literal(holder, '0'), '"bar"')
})
