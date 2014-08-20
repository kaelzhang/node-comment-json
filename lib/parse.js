'use strict';

module.exports = parse;

var parser = require('json-parser');

function parse (code, reviver) {
  if (Object(code) !== code) {
    return JSON.parse(code, reviver);
  }

  return parser.parse(code, reviver);
}
