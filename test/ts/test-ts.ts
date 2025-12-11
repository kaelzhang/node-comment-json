import {
  parse,
  stringify,
  tokenize,

  CommentArray,
  CommentObject,
  assign,
  moveComments,
  removeComments,
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

// Test moveComments function
const moveCommentsTest = parse(`{
  "foo": 1, // comment on foo
  "bar": 2
}`) as CommentObject

moveComments(moveCommentsTest, moveCommentsTest,
  { where: 'after', key: 'foo' },
  { where: 'before', key: 'bar' }
)

const moveResult = stringify(moveCommentsTest, null, 2)
assert(moveResult.includes('// comment on foo'), 'moveComments basic functionality')

// Test moveComments with non-property comments
const moveNonPropTest = parse(`// top comment
{
  "foo": 1
}`) as CommentObject

moveComments(moveNonPropTest, moveNonPropTest,
  { where: 'before-all' },
  { where: 'after-all' }
)

const moveNonPropResult = stringify(moveNonPropTest, null, 2)
assert(moveNonPropResult.includes('// top comment'), 'moveComments non-property comments')

// Test moveComments between different objects
const sourceObj = parse(`{
  "source": 1 // source comment
}`) as CommentObject

const targetObj = parse('{"target": 2}') as CommentObject

moveComments(sourceObj, targetObj,
  { where: 'after', key: 'source' },
  { where: 'before', key: 'target' }
)

const crossObjectResult = stringify(targetObj, null, 2)
assert(crossObjectResult.includes('// source comment'), 'moveComments cross-object')

// Test removeComments function
const removeTest = parse(`{
  // comment before foo
  "foo": 1, // comment after foo
  "bar": 2
}`) as CommentObject

removeComments(removeTest, { where: 'before', key: 'foo' })

const removeResult = stringify(removeTest, null, 2)
assert(!removeResult.includes('// comment before foo'), 'removeComments removes comment')
assert(removeResult.includes('// comment after foo'), 'removeComments preserves other comments')

// Test removeComments with non-property comments
const removeNonPropTest = parse(`// top comment
{
  "foo": 1
}
// bottom comment`) as CommentObject

removeComments(removeNonPropTest, { where: 'before-all' })
removeComments(removeNonPropTest, { where: 'after-all' })

const removeNonPropResult = stringify(removeNonPropTest, null, 2)
assert(!removeNonPropResult.includes('// top comment'), 'removeComments removes before-all')
assert(!removeNonPropResult.includes('// bottom comment'), 'removeComments removes after-all')

// Test TypeScript type safety for CommentPosition
const validPosition: { where: 'before', key?: string } = { where: 'before', key: 'test' }
const validNonPropPosition: { where: 'before-all', key?: string } = { where: 'before-all' }

// These should compile without errors
moveComments(moveCommentsTest, moveCommentsTest, validPosition, validNonPropPosition)
removeComments(removeTest, validPosition)

console.log('All TypeScript tests passed!')
