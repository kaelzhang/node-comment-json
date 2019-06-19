[![Build Status](https://travis-ci.org/kaelzhang/node-comment-json.svg?branch=master)](https://travis-ci.org/kaelzhang/node-comment-json)
[![Coverage](https://codecov.io/gh/kaelzhang/node-comment-json/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/node-comment-json)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/node-comment-json?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/node-comment-json)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/comment-json.svg)](http://badge.fury.io/js/comment-json)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/comment-json.svg)](https://www.npmjs.org/package/comment-json)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/node-comment-json.svg)](https://david-dm.org/kaelzhang/node-comment-json)
-->

# comment-json

- Parse JSON strings with comments into JavaScript objects
- Stringify the objects into JSON strings with comments if there are

The usage of `comment-json` is exactly the same as the vanilla [`JSON`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) object.

## Install

```sh
$ npm i comment-json
```

## Usage

package.json:

```js
{
  // package name
  "name": "comment-json"
}
```

```js
const {
  parse,
  stringify
} = require('comment-json')
const fs = require('fs')

const obj = parse(fs.readFileSync('package.json').toString())

console.log(obj.name) // comment-json

stringify(obj, null, 2)
// Will be the same as package.json,
// which will be very useful if we use a json file to store configurations.
```

## parse(string, reviver? = null, removes_comments? = false)

The arguments are the same as the vanilla [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse), except for `removes_comments`:

- **removes_comments** `Boolean` If true, the comments won't be maintained, which is often used when we want to get a clean object.

#### Let's jump into a much more integrated case:

`comment-json` uses [`json-parser`](https://github.com/kaelzhang/node-json-parser). For a more complicated case, see [here](https://github.com/kaelzhang/node-json-parser#usage).

#### If you want to strip comments

```js
parse(code, null, true)
// -> {a: 1}
```

## stringify(object, replacer?, space?): string

The arguments are the same as the vanilla [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).

And it does the similar thing as the vanilla one, but also deal with extra properties and convert them into comments.

#### space

If space is not specified, or the space is an empty string, the result of `json.stringify()` will be no comments.

For the case above:

```js
console.log(stringify(result)) // {"a":1}
console.log(stringify(result, null, 2)) // is the same as `code`
```

## License

[MIT](LICENSE)
