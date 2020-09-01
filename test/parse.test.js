const test = require('ava')

const parser = require('..')

// var a = parser.parse('//top\n{// top a\n/* abc */"a":1,//right\n/* bcd */"b":{"a":1}}//bottom');
// // var a = parser.parse('{/*top*/"a":1,//right\n/*abc*/"b":{"a":1}}');
// console.log(a);

const cases = [
  {
    d: '#21: introduce `after:prop` symbol',
    s: `{
  "foo": "bar" /* after value:foo */, // after:foo
  "bar": "baz" // after:baz
}`,
    o: '{"foo":"bar","bar":"baz"}',
    e (t, obj) {
      t.is(obj[Symbol.for('after-value:foo')][0].value, ' after value:foo ')
      t.is(obj[Symbol.for('after:foo')][0].value, ' after:foo')
      t.is(obj[Symbol.for('after:bar')][0].value, ' after:baz')
    }
  },
  {
    d: '#21: introduce `after:prop` symbol: array',
    s: `[
  1 /* after value:0 */, // after:0
  2 // after:1
]`,
    o: '[1,2]',
    e (t, obj) {
      t.is(obj[Symbol.for('after-value:0')][0].value, ' after value:0 ')
      t.is(obj[Symbol.for('after:0')][0].value, ' after:0')
      t.is(obj[Symbol.for('after:1')][0].value, ' after:1')
    }
  },
  {
    d: 'empty object',
    s: `
{
  // comment
}
`,
    o: '{}',
    e (t, obj) {
      t.is(obj[Symbol.for('before')][0].value, ' comment')
    }
  },
  {
    d: 'empty array',
    s: `
[
  // comment
]
`,
    o: '[]',
    e (t, obj) {
      t.is(obj[Symbol.for('before')][0].value, ' comment')
    }
  },
  {
    d: '#17: after-comma comment, with trailing comma',
    s: `//top
{
  "foo": "bar", // after comma foo
  "bar": "baz", // after comma bar
}`,
    o: '{"foo":"bar","bar":"baz"}',
    e (t, obj) {
      t.is(obj.foo, 'bar')
      t.is(obj[Symbol.for('after:foo')][0].value, ' after comma foo')
      t.is(obj[Symbol.for('after:bar')][0].value, ' after comma bar')
    }
  },
  {
    d: '#8: object with trailing comma',
    s: `//top
{
  "foo": "bar",
  // after
}`,
    o: '{"foo":"bar"}',
    e (t, obj) {
      t.is(obj.foo, 'bar')
      t.is(obj[Symbol.for('after:foo')][0].value, ' after')
    }
  },
  {
    d: '#8: array with trailing comma',
    s: `//top
[1,]`,
    o: '[1]',
    e (t, obj) {
      t.is(Number(obj[0]), 1)
      t.is(obj[Symbol.for('before-all')][0].value, 'top')
    }
  },
  {
    d: 'comment at the top',
    s: '//top\n{"a":1}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      t.is(obj[Symbol.for('before-all')][0].value, 'top')
    }
  },
  {
    d: 'multiple comments at the top, both line and block',
    s: '//top\n/*abc*/{"a":1}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)

      const [c1, c2] = obj[Symbol.for('before-all')]
      t.is(c1.value, 'top')
      t.is(c1.type, 'LineComment')
      t.is(c2.value, 'abc')
      t.is(c2.type, 'BlockComment')
    }
  },
  {
    d: 'comment at the bottom',
    s: '{"a":1}\n//bot',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c] = obj[Symbol.for('after-all')]
      t.is(c.value, 'bot')
    }
  },
  {
    d: 'multiple comments at the bottom, both line and block',
    s: '{"a":1}\n//top\n/*abc*/',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c1, c2] = obj[Symbol.for('after-all')]
      t.is(c1.value, 'top')
      t.is(c2.value, 'abc')
    }
  },
  {
    d: 'comment for properties',
    s: '{//a\n"a":1}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c] = obj[Symbol.for('before:a')]
      t.is(c.value, 'a')
      t.is(c.inline, true)
    }
  },
  {
    d: 'comment for properties, multiple at the top',
    s: '{//a\n/*b*/"a":1}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c1, c2] = obj[Symbol.for('before:a')]
      t.is(c1.value, 'a')
      t.is(c1.inline, true)
      t.is(c2.value, 'b')
      t.is(c2.inline, false)
    }
  },
  {
    d: 'comment for properties, both top and right',
    s: '{//a\n"a":1//b\n}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c] = obj[Symbol.for('after:a')]
      t.is(c.value, 'b')
      t.is(c.inline, true)
    }
  },
  {
    // #8
    d: 'support negative numbers',
    s: '{//a\n"a": -1}',
    o: '{"a": -1}',
    e (t, obj) {
      t.is(obj.a, - 1)
    }
  },
  {
    d: 'inline comment after prop',
    s: `{
"a" /* a */: 1
    }`,
    o: '{"a":1}',
    e (t, obj) {
      const [c] = obj[Symbol.for('after-prop:a')]
      t.is(c.value, ' a ')
      t.is(c.inline, true)
    }
  },
  {
    d: 'inline comment after comma',
    s: `{
      "a": 1, // a
      "b": 2
    }`,
    o: '{"a":1,"b":2}',
    e (t, obj) {
      t.is(obj.a, 1)
      t.is(obj.b, 2)
      const [c] = obj[Symbol.for('after:a')]
      t.is(c.value, ' a')
      t.is(c.inline, true)
    }
  },
  {
    d: 'array',
    s: `{
      "a": /*a*/ [ // b
        //c
        1 /*m*/ , // d
        // e
        2
        // n
      ] /*
g*/ //g2
      //h
      ,
      "b" /*i*/
      // j
        :
        // k
        1
    } // f
    //l`,
    o: `{
      "a": [1, 2],
      "b": 1
    }`,
    e (t, obj) {
      t.is(obj.a[0], 1)
      t.is(obj.a[1], 2)

      const [g, g2, h] = obj[Symbol.for('after-value:a')]

      t.deepEqual(g, {
        type: 'BlockComment',
        value: '\ng',
        inline: true,
        loc: {
          start: {
            line: 8,
            column: 8
          },
          end: {
            line: 9,
            column: 3
          }
        }
      })
      t.deepEqual(g2, {
        type: 'LineComment',
        value: 'g2',
        inline: true,
        loc: {
          start: {
            line: 9,
            column: 4
          },
          end: {
            line: 9,
            column: 8
          }
        }
      })
      t.deepEqual(h, {
        type: 'LineComment',
        value: 'h',
        inline: false,
        loc: {
          start: {
            line: 10,
            column: 6
          },
          end: {
            line: 10,
            column: 9
          }
        },
      })

      const [i, j] = obj[Symbol.for('after-prop:b')]
      t.is(i.value, 'i')
      t.is(i.inline, true)
      t.is(j.value, ' j')

      const [k] = obj[Symbol.for('after-colon:b')]
      t.is(k.value, ' k')

      const [b, c] = obj.a[Symbol.for('before:0')]
      t.is(b.value, ' b')
      t.is(c.value, 'c')

      const [d] = obj.a[Symbol.for('after:0')]
      t.is(d.value, ' d')

      const [e] = obj.a[Symbol.for('before:1')]
      t.is(e.value, ' e')

      const [n] = obj.a[Symbol.for('after:1')]
      t.is(n.value, ' n')

      const [m] = obj.a[Symbol.for('after-value:0')]
      t.is(m.value, 'm')

      const [f, l] = obj[Symbol.for('after-all')]
      t.is(f.value, ' f')
      t.is(f.inline, true)
      t.is(l.value, 'l')
      t.is(l.inline, false)
    }
  }
]

cases.forEach(c => {
  const tt = c.only
    ? test.only
    : test

  tt(c.d, t => {
    c.e(t, parser.parse(c.s))
  })

  tt(`${c.d}, removes comments`, t => {
    t.deepEqual(parser.parse(c.s, null, true), parser.parse(c.o))
  })
})

const invalid = [
  ['{', 1, 1],
  ['}', 1, 0],
  ['[', 1, 1],
  ['', 1, 0],
  ['{a:1}', 1, 1],
  ['{"a":a}', 1, 5],
  ['{"a":undefined}', 1, 5]
]

const removes_position = s => s.replace(/\s+in JSON at position.+$/, '')

// ECMA262 does not define the standard of error messages.
// However, we throw error messages the same as JSON.parse()
invalid.forEach(([i, line, col]) => {
  test(`error message:${i}`, t => {
    let error
    let err

    try {
      parser.parse(i)
    } catch (e) {
      error = e
    }

    try {
      JSON.parse(i)
    } catch (e) {
      err = e
    }

    t.is(!!(err && error), true)
    t.is(error.message, removes_position(err.message))

    if (line !== undefined && col !== undefined) {
      t.is(error.line, line)
      t.is(error.column, col)
    }
  })
})

test('reviver', t => {
  t.is(
    parser.parse('{"p": 5}', (key, value) =>
      typeof value === 'number'
        ? value * 2 // return value * 2 for numbers
        : value     // return everything else unchanged
    ).p,
    10
  )
})

test('special: null', t => {
  t.is(parser.parse(`// abc\nnull`), null)
})

test('special: 1', t => {
  const result = parser.parse(`//abc\n1`)

  t.is(Number(result), 1)
  t.is(result[Symbol.for('before-all')][0].value, 'abc')
})

test('special: "foo"', t => {
  const result = parser.parse(`//abc\n"foo"`)

  t.is(String(result), 'foo')
  t.is(result[Symbol.for('before-all')][0].value, 'abc')
})

test('special: true', t => {
  const result = parser.parse(`//abc\ntrue`)

  t.true(Boolean(result))
  t.is(result[Symbol.for('before-all')][0].value, 'abc')
})

test('#20: Object.keys', t => {
  const content = `{
  // comment
  "foo": "bar"
}`

  const parsed = parser.parse(content)

  t.deepEqual(Object.keys(parsed), ['foo'])
})
