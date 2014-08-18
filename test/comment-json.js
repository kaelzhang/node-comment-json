'use strict';

var expect = require('chai').expect;
var json = require('../');
var fixture = require('test-fixture');
var fs = require('fs');

function each (subjects, replacers, spaces, iterator) {
  subjects.forEach(function (subject) {
    replacers.forEach(function (replacer) {
      spaces.forEach(function (space) {
        iterator(subject, replacer, space);
      });
    });
  });
}

describe("vanilla usage of `json.stringify()`", function(){
  var subjects = [
    'abc',
    1,
    true,
    false,
    null,
    undefined,
    [],
    {},
    {a: 1},
    ['abc', 1, {a: 1, b: undefined}],
    [undefined, 1, 'abc'],
    {
      a: undefined,
      b: false,
      c: [1, '1']
    }
  ];

  var replacers = [
    null,
    function (key, value) {
      if (typeof value === 'string') {
        return undefined;
      }

      return value;
    }
  ];

  var spaces = [
    1,
    2,
    '  ',
    '1'
  ];
  
  each(subjects, replacers, spaces, function (subject, replacer, space) {
    var desc = [subject, replacer, space].map(function (s) {
      return JSON.stringify(s);
    }).join(', ');

    it(desc, function(){
      expect(json.stringify(subject, replacer, space))
        .to
        .equal(JSON.stringify(subject, replacer, space));
    });
  });
});

describe("enhanced json.stringify()", function(){
  var f = fixture();

  function run (name, replacer, space) {
    var file = f.resolve(name + '.js');
    var e = [name, replacer, space].map(function (s) {
      return s === null
        ? 'null'
        : s === undefined
          ? 'undefined'
          : s;
    }).join('-') + '.json';
    e = f.resolve(e);
    var desc = [name, replacer, space].map(function (s) {
      return JSON.stringify(s);
    }).join(', ');

    it(desc, function(){
      expect(json.stringify(require(file), replacer, space)).to.equal(fs.readFileSync(e).toString());
    });
  }

  each([
    'single-top',
    'single-right'
  ], 
  [null], 
  [2, 3, null], run);
});
