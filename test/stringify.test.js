const test = require('ava')
const {resolve} = require('test-fixture')()
const fs = require('fs')
const {isFunction} = require('core-util-is')
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

each(SUBJECTS, REPLACERS, SPACES, (subject, replacer, space, desc) => {
  test(`stringify: ${desc}`, t => {
    const compare = [
      JSON.stringify(subject, replacer, space),
      stringify(subject, replacer, space)
    ]

    console.log(compare)

    t.is(...compare)
  })
})

// describe('vanilla usage of `json.stringify()`', () => {
//   each(subjects, replacers, spaces, (subject, replacer, space, desc) => {
//     it(`stringify: ${desc}`, () => {
//       expect(json.stringify(subject, replacer, space))
//       .to
//       .equal(JSON.stringify(subject, replacer, space))
//     })
//   })
// })

// describe('enhanced json.stringify()', () => {
//   const f = fixture()

//   function run (name, replacer, space, desc) {
//     const file = f.resolve(`${name}.js`)
//     let e = `${[name, replacer, space].map(s => s === null
//       ? 'null'
//       : s === undefined
//         ? 'undefined'
//         : s).join('-')}.json`
//     e = f.resolve(e)

//     it(desc, () => {
//       expect(json.stringify(require(file), replacer, space)).to.equal(fs.readFileSync(e).toString())
//     })
//   }

//   each([
//     'single-top',
//     'single-right',
//     'duplex',
//     'deep',
//     // simple case, of which the comment is not an array.
//     'simple',
//     // #2
//     'indent'
//   ],
//   [null],
//   [2, 3, null], run)
// })


// describe('json.stringify() should take care of prototype', () => {
//   it('normal case', () => {
//     const obj = {
//       a: 1
//     }

//     obj.__proto__ = {
//       b: 1
//     }

//     expect(json.stringify(obj)).to.equal('{"a":1}')
//   })

//   it('with comments', () => {
//     const obj = {
//       a: 1,
//       '//^': ['// a']
//     }

//     obj.__proto__ = {
//       b: 1
//     }

//     expect(json.stringify(obj)).to.equal('{"a":1}')
//     expect(json.stringify(obj, null, 2)).to.equal('// a\n{\n  "a": 1\n}')
//   })
// })
