

const {expect} = require('chai')
const fixture = require('test-fixture')
const fs = require('fs')
const json = require('../')

function each (subjects, replacers, spaces, iterator) {
  subjects.forEach(subject => {
    replacers.forEach(replacer => {
      spaces.forEach(space => {
        const desc = [subject, replacer, space].map(s => JSON.stringify(s)).join(', ')
        iterator(subject, replacer, space, desc)
      })
    })
  })
}

const subjects = [
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
    c: [1, '1']
  }
]

const replacers = [
  null,
  function (key, value) {
    if (typeof value === 'string') {
      return undefined
    }

    return value
  }
]

const spaces = [
  1,
  2,
  '  ',
  '1'
]

describe('vanilla usage of `json.stringify()`', () => {
  each(subjects, replacers, spaces, (subject, replacer, space, desc) => {
    it(`stringify: ${desc}`, () => {
      expect(json.stringify(subject, replacer, space))
      .to
      .equal(JSON.stringify(subject, replacer, space))
    })
  })
})

describe('enhanced json.stringify()', () => {
  const f = fixture()

  function run (name, replacer, space, desc) {
    const file = f.resolve(`${name}.js`)
    let e = `${[name, replacer, space].map(s => s === null
      ? 'null'
      : s === undefined
        ? 'undefined'
        : s).join('-')}.json`
    e = f.resolve(e)

    it(desc, () => {
      expect(json.stringify(require(file), replacer, space)).to.equal(fs.readFileSync(e).toString())
    })
  }

  each([
    'single-top',
    'single-right',
    'duplex',
    'deep',
    // simple case, of which the comment is not an array.
    'simple',
    // #2
    'indent'
  ],
  [null],
  [2, 3, null], run)
})


describe('json.stringify() should take care of prototype', () => {
  it('normal case', () => {
    const obj = {
      a: 1
    }

    obj.__proto__ = {
      b: 1
    }

    expect(json.stringify(obj)).to.equal('{"a":1}')
  })

  it('with comments', () => {
    const obj = {
      a: 1,
      '//^': ['// a']
    }

    obj.__proto__ = {
      b: 1
    }

    expect(json.stringify(obj)).to.equal('{"a":1}')
    expect(json.stringify(obj, null, 2)).to.equal('// a\n{\n  "a": 1\n}')
  })
})


function every (subject, checker) {
  if (Object(subject) !== subject) {
    return checker(subject)
  }

  if (Array.isArray(subject)) {
    return subject.every(v => every(v, checker))
  }

  let key
  for (key in subject) {
    if (!every(subject[key], checker)) {
      return false
    }
  }

  return true
}


describe('vanilla json.parse()', () => {
  each(subjects, replacers, spaces, (subject, replacer, space, desc) => {
    if (typeof space !== 'number' && !(typeof space === 'string' && /^\s*$/.test(space))) {
      return
    }

    if (!every(subject, v => v !== undefined)) {
      return
    }

    if (typeof replacer === 'function') {
      return
    }

    it(`parse: ${desc}`, () => {
      const str = JSON.stringify(subject, replacer, space)
      expect(json.parse(str)).to.deep.equal(subject)
    })
  })
})


const invalid = [
  '{',
  '}',
  '[',
  '',
  '{a:1}',
  '{"a":a}',
  '{"a":undefined}'
]

// ECMA262 does not define the standard of error messages.
// However, we throw error messages the same as JSON.parse()
describe('error messages', () => {
  invalid.forEach(i => {
    it(`error message:${i}`, () => {
      let error
      let err

      try {
        json.parse(i)
      } catch (e) {
        error = e
      }

      try {
        JSON.parse(i)
      } catch (e) {
        err = e
      }

      expect(!!(err && error)).to.equal(true)
      expect(error.message).to.equal(err.message)
    })
  })
})
