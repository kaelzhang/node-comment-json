const {
  isArray, isObject, isFunction, isNumber, isString
} = require('core-util-is')
const repeat = require('repeat-string')

const {
  PREFIX_BEFORE,
  PREFIX_AFTER_PROP,
  PREFIX_AFTER_COLON,
  PREFIX_AFTER_VALUE,
  PREFIX_AFTER,

  BRACKET_OPEN,
  BRACKET_CLOSE,
  CURLY_BRACKET_OPEN,
  CURLY_BRACKET_CLOSE,
  COLON,
  COMMA,
  EMPTY
} = require('./parse')

// eslint-disable-next-line no-control-regex
const ESCAPABLE = /[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g

// String constants
const SPACE = ' '
const LF = '\n'
const STR_NULL = 'null'

const RETURN_TRUE = () => true

// Symbol tags
const BEFORE = prop => `${PREFIX_BEFORE}:${prop}`
const AFTER_PROP = prop => `${PREFIX_AFTER_PROP}:${prop}`
const AFTER_COLON = prop => `${PREFIX_AFTER_COLON}:${prop}`
const AFTER_VALUE = prop => `${PREFIX_AFTER_VALUE}:${prop}`

// table of character substitutions
const meta = {
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
  '"': '\\"',
  '\\': '\\\\'
}

const escape = string => {
  ESCAPABLE.lastIndex = 0
  if (!ESCAPABLE.test(string)) {
    return string
  }

  return string.replace(ESCAPABLE, a => {
    const c = meta[a]
    return typeof c === 'string'
      ? c
      : `\\u${(`0000${a.charCodeAt(0).toString(16)}`).slice(- 4)}`
  })
}

// Escape no control characters, no quote characters,
// and no backslash characters,
// then we can safely slap some quotes around it.
const quote = string => `"${escape(string)}"`
const comment_stringify = (value, line) => line
  ? `//${value}`
  : `/*${value}*/`

// display_block `boolean` whether the
//   WHOLE block of comments is always a block group
const process_comments = (host, symbol_tag, deeper_gap, display_block) => {
  const comments = host[Symbol.for(symbol_tag)]
  if (!comments || !comments.length) {
    return EMPTY
  }

  let is_line_comment = false

  const str = comments.reduce((prev, {
    inline,
    type,
    value
  }) => {
    const delimiter = inline
      ? SPACE
      : LF + deeper_gap

    is_line_comment = type === 'LineComment'

    return prev + delimiter + comment_stringify(value, is_line_comment)
  }, EMPTY)

  return display_block
    ? str
    : is_line_comment
      // line comment should always end with a LF
      ? str + LF + deeper_gap
      : str
}

let replacer = null
let indent = EMPTY

const clean = () => {
  replacer = null
  indent = EMPTY
}

const join_content = (inside, value, gap) => {
  const comment = process_comments(value, PREFIX_BEFORE, gap + indent, true)

  return comment
    ? inside
      // Symbol.for('before') and Symbol.for('before:prop')
      // might both exist if user mannually add comments to the object
      // and make a mistake.
      // We trim to make sure the layout
      ? comment + inside.trim() + LF + gap
      : comment.trimRight() + LF + gap
    : inside
      ? inside.trimRight() + LF + gap
      : EMPTY
}

// | deeper_gap   |
// | gap | indent |
//       [
//                "foo",
//                "bar"
//       ]
const array_stringify = (value, gap) => {
  const deeper_gap = gap + indent

  const {length} = value
  const max = length - 1

  // From the item to before close
  let inside = EMPTY

  // Never use Array.prototype.forEach,
  // that we should iterate all items
  for (let i = 0; i < length; i ++) {
    inside += process_comments(value, BEFORE(i), deeper_gap, true)
    + (
      stringify(i, value, deeper_gap)
      || STR_NULL
    )
    + process_comments(value, AFTER_VALUE(i), deeper_gap)

    if (i === max) {
      inside += COMMA
    }
  }

  inside += process_comments(value, PREFIX_AFTER, deeper_gap)

  return BRACKET_OPEN
   + join_content(inside, value, gap)
   + BRACKET_CLOSE
}

// | deeper_gap   |
// | gap | indent |
//       {
//                "foo": 1,
//                "bar": 2
//       }
const object_stringify = (value, gap) => {
  // Due to a specification blunder in ECMAScript, typeof null is 'object',
  // so watch out for that case.
  if (!value) {
    return 'null'
  }

  const deeper_gap = gap + indent
  // Between two key-value pairs except indent
  const delimiter = LF + gap

  const colon_value_gap = indent
    ? SPACE
    : EMPTY

  // From the first element to before close
  const inside = []

  // // Only process comments when indent is not EMPTY
  // if (indent) {
  //   str += process_comments(value, BEFORE, deeper_gap, true)
  // }

  if (isArray(replacer)) {

  }

  const keys = Object.keys(value)
  .filter(k => value[k] !== undefined)

  const max = keys.length - 1

  const has_key = isArray(replacer)
    // replacer, as an array
    ? key => replacer.includes(key)
    : RETURN_TRUE

  keys.forEach((k, i) => {
    const has = has_key(k)

    if (has) {
      inside += quote(k)
      + process_comments(value, AFTER_PROP(k), deeper_gap)
      + COLON
      + process_comments(value, AFTER_COLON(k), deeper_gap)
      + colon_value_gap
      + (
        stringify(k, value, replacer, indent, deeper_gap)
        || STR_NULL
      )
      + process_comments(value, AFTER_VALUE(k), deeper_gap)
    }

    inside += i === max
      ? delimiter
      : process_comments(value, AFTER_COMMA(k), deeper_gap)
        + COMMA + delimiter + indent
  })

  return CURLY_BRACKET_OPEN
  + join_content(inside, value, indent, gap)
  + CURLY_BRACKET_CLOSE
}

// @param {string} key
// @param {Object} holder
// @param {function()|Array} replacer
// @param {string} indent
// @param {string} gap
function stringify (key, holder, gap) {
  let value = holder[key]

  // If the value has a toJSON method, call it to obtain a replacement value.
  if (isObject(value) && isFunction(value.toJSON)) {
    value = value.toJSON(key)
  }

  // If we were called with a replacer function, then call the replacer to
  // obtain a replacement value.
  if (isFunction(replacer)) {
    value = replacer.call(holder, key, value)
  }

  switch (typeof value) {
  case 'string':
    return quote(value)

  case 'number':
    // JSON numbers must be finite. Encode non-finite numbers as null.
    return Number.isFinite(value) ? String(value) : STR_NULL

  case 'boolean':
  case 'null':

    // If the value is a boolean or null, convert it to a string. Note:
    // typeof null does not produce 'null'. The case is included here in
    // the remote chance that this gets fixed someday.
    return String(value)

  // If the type is 'object', we might be dealing with an object or an array or
  // null.
  case 'object':
    return isArray(value)
      ? array_stringify(value, replacer, gap)
      : object_stringify(value, replacer, gap)

  // undefined
  default:
    // JSON.stringify(undefined) === undefined
    // JSON.stringify('foo', () => undefined) === undefined
  }
}

const get_indent = space => isString(space)
  // If the space parameter is a string, it will be used as the indent string.
  ? space
  : isNumber(space)
    ? repeat(SPACE, space)
    : EMPTY

// @param {function()|Array} replacer
// @param {string|number} space
module.exports = (value, replacer_, space) => {
  // The stringify method takes a value and an optional replacer, and an optional
  // space parameter, and returns a JSON text. The replacer can be a function
  // that can replace values, or an array of strings that will select the keys.
  // A default replacer method can be provided. Use of the space parameter can
  // produce text that is more easily readable.

  // If the space parameter is a number, make an indent string containing that
  // many spaces.
  const indent_ = get_indent(space)

  if (!indent_) {
    return JSON.stringify(value, replacer_)
  }

  // ~~If there is a replacer, it must be a function or an array.
  // Otherwise, throw an error.~~
  // vanilla `JSON.parse` allow invalid replacer
  if (!isFunction(replacer_) && !isArray(replacer_)) {
    replacer_ = null
  }

  replacer = replacer_
  indent = indent_

  const str = stringify('', {'': value}, EMPTY)

  clean()

  return isObject(value)
    ? process_comments(value, PREFIX_BEFORE, EMPTY).trimLeft()
      + str
      + process_comments(value, PREFIX_AFTER, EMPTY)
    : str
}
