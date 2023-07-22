const {parse, tokenize} = require('./parse')
const stringify = require('./stringify')
const {CommentArray} = require('./array')
const {assign,deepAssign} = require('./common')

module.exports = {
  parse,
  stringify,
  tokenize,

  CommentArray,
  assign,
  deepAssign
}
