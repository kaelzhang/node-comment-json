import {
  parse,
  stringify,
  tokenize,

  CommentArray,
  CommentObject,
  assign,
  CommentDescriptor,
  CommentSymbol
} from '../..'

const assert = (test: boolean, message: string): void => {
  if (!test) {
    throw new Error(message)
  }
}

assert((parse('{"a":1}') as CommentObject).a === 1, 'basic parse')

const str = `{
  // This is a comment
  "foo": "bar"
}`
const parsed = parse(str)

const obj = assign({
  bar: 'baz'
}, parsed)

assert(stringify(obj, null, 2) === `{
  "bar": "baz",
  // This is a comment
  "foo": "bar"
}`, 'assign')

assert(Array.isArray(tokenize(str)), 'tokenize')

const comment = "this is a comment"
let commentDescriptor: CommentDescriptor = `before:0`

const commentSrc = `[
  //${comment}
  "bar"
]`

assert((parse(commentSrc) as CommentArray<string>)[Symbol.for(commentDescriptor) as CommentSymbol][0].value === comment, 'comment parse')
commentDescriptor = "before";
