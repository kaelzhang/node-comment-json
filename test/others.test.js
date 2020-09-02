const test = require('ava')
const {parse, stringify, assign} = require('..')


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

test('#21: comma placement', t => {
  const parsed = parse(`{
  "foo": "bar" // comment
}`
  )

  parsed.bar = 'baz'

  t.is(stringify(parsed, null, 2), `{
  "foo": "bar", // comment
  "bar": "baz"
}`)
})

test('#18', t => {
  const parsed = parse(`{
  // b
  "b": 2,
  // a
  "a": 1
}`
  )

  const sorted = assign({}, parsed, Object.keys(parsed).sort())

  t.is(stringify(sorted, null, 2), `{
  // a
  "a": 1,
  // b
  "b": 2
}`)
})

test('#26: non-property comments', t => {
  const str = `// before all
{
  // a
  "a": 1
}
// after all`

  const parsed = parse(str)

  t.is(
    stringify(
      assign(
        {},
        parsed,
      ),
      null, 2
    ),
    str,
    'should assign non-property comments if no keys'
  )

  t.is(
    stringify(
      assign(
        {
          a: 1
        },
        parsed,
        []
      ),
      null, 2
    ),
    `// before all
{
  "a": 1
}
// after all`,
    'should assign non-property comments if keys is an empty array'
  )

  t.is(
    stringify(
      assign(
        {},
        parsed,
        ['a']
      ),
      null,
      2
    ),
    `{
  // a
  "a": 1
}`)
})
