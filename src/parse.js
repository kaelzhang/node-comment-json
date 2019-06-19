

module.exports = parse

const parser = require('json-parser')

function parse (code, reviver, removes_comments) {
  return parser.parse(code, reviver, removes_comments)
}
