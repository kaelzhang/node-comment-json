import {
  parse,
  stringify,
  tokenize,

  CommentArray,
  CommentObject,
  assign,
  moveComments,
  removeComments,
  removeBlankLines,
  CommentDescriptor,
  CommentSymbol
} from '../..'

const assert = (test: boolean, message: string): void => {
  if (!test) {
    throw new Error(message)
  }
}

assert((parse('{"a":1}') as CommentObject).a === 1, 'basic parse')

interface ExtensionsJson {
  recommendations: string[]
}

let extensions: ExtensionsJson | undefined
extensions = parse<ExtensionsJson>(`{
  "recommendations": [
    "example.extension"
  ]
}`)

assert(
  (extensions?.recommendations?.indexOf('example.extension') ?? - 1) >= 0,
  'typed parse: extensions recommendations'
)

const str = `{
  // This is a comment
  "foo": "bar"
}`
const parsed = parse(str)
const parsedWithoutBlankLines = parse(str, null, { no_blank_lines: true }) as CommentObject
const parsedWithoutComments = parse(`{
  // This is a comment

  "foo": "bar"
}`, null, { no_comments: true }) as CommentObject

const obj = assign({
  bar: 'baz'
}, parsed)

assert(stringify(obj, null, 2) === `{
  "bar": "baz",
  // This is a comment
  "foo": "bar"
}`, 'assign')

assert(Array.isArray(tokenize(str)), 'tokenize')
assert(typeof parsedWithoutBlankLines.foo === 'string', 'parse options: no_blank_lines')
assert(Array.isArray(parsedWithoutComments[Symbol.for('before:foo') as CommentSymbol]), 'parse options: no_comments')

const comment = "this is a comment"
let commentDescriptor: CommentDescriptor = `before:0`

const commentSrc = `[
  //${comment}
  "bar"
]`

const parsedCommentTokens = (parse(commentSrc) as CommentArray<string>)[Symbol.for(commentDescriptor) as CommentSymbol]
assert(parsedCommentTokens[0].type !== 'BlankLine', 'comment parse token type')
assert(parsedCommentTokens[0].type !== 'BlankLine' && parsedCommentTokens[0].value === comment, 'comment parse')
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

// Test removeBlankLines function
const removeBlankLinesTest = parse(`{
  // comment before foo

  "foo": 1,

  "bar": 2
}`) as CommentObject

removeBlankLines(removeBlankLinesTest, { where: 'before', key: 'foo' })
removeBlankLines(removeBlankLinesTest)

const removeBlankLinesResult = stringify(removeBlankLinesTest, null, 2)
assert(!removeBlankLinesResult.includes('\n\n'), 'removeBlankLines removes blank lines')

// Test TypeScript type safety for CommentPosition
const validPosition: { where: 'before', key?: string } = { where: 'before', key: 'test' }
const validNonPropPosition: { where: 'before-all', key?: string } = { where: 'before-all' }

// These should compile without errors
moveComments(moveCommentsTest, moveCommentsTest, validPosition, validNonPropPosition)
removeComments(removeTest, validPosition)
removeBlankLines(removeBlankLinesTest, validPosition)
removeBlankLines(removeBlankLinesTest)

console.log('All TypeScript tests passed!')
