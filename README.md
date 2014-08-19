# comment-json [![NPM version](https://badge.fury.io/js/comment-json.svg)](http://badge.fury.io/js/comment-json) [![Build Status](https://travis-ci.org/kaelzhang/node-comment-json.svg?branch=master)](https://travis-ci.org/kaelzhang/node-comment-json) [![Dependency Status](https://gemnasium.com/kaelzhang/node-comment-json.svg)](https://gemnasium.com/kaelzhang/node-comment-json)

Parse and stringify JSON file with domments.

## Install

```sh
$ npm install comment-json --save
```

## Usage

package.json:

```json
{
  // package name
  "name": "comment-json"
}
```

```js
var json = require('comment-json');
var obj = json.parse(fs.readFileSync('package.json').toString());
console.log(obj);
// ->
// {
//   "// name": "// package name",
//   name: "comment-json"
// }

json.stringify(obj, null, 2); // Will be the same as package.json
```

### json.parse(string, [reviver])

The arguments are the same as the vanilla [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse).


### json.stringify(object, [replacer], [space])

The arguments are the same as the vanilla [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).

And it does the similar thing as the vanilla one, and also stringify the `"// abc"`-like property into comments if the `"abc"` property is found.


#<!-- ## json.strip(string)

Strips comments from `string`.

### json.clean(object)

Clean comment properties.

```js
var object = {
  "// name": "// package name",
  name: "comment-json"
};
json.clean(object); // {name: "comment-json"}
``` -->

## License

MIT
