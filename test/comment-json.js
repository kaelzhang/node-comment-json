'use strict';

var expect = require('chai').expect;
var json = require('../');

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
  
  subjects.forEach(function (subject) {
    replacers.forEach(function (replacer) {
      spaces.forEach(function (space) {
        var desc = [subject, replacer, space].map(function (s) {
          return JSON.stringify(s);
        }).join(', ');

        it(desc, function(){
          expect(json.stringify(subject, replacer, space)).to.equal(JSON.stringify(subject, replacer, space));
        });
      });
    });
  });
});