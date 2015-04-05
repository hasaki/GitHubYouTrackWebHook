/*jshint globalstrict: true*/
/*global require, exports */

'use strict';

var _ = require('underscore');
var Youtrack = require('../lib/youtrack.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit
  Test methods:
	test.expect(numAssertions)
	test.done()
  Test assertions:
	test.ok(value, [message])
	test.equal(actual, expected, [message])
	test.notEqual(actual, expected, [message])
	test.deepEqual(actual, expected, [message])
	test.notDeepEqual(actual, expected, [message])
	test.strictEqual(actual, expected, [message])
	test.notStrictEqual(actual, expected, [message])
	test.throws(block, [error], [message])
	test.doesNotThrow(block, [error], [message])
	test.ifError(value)
*/


exports.youtrack = {
	setUp: function (done) {
		// setup here
		done();
	},
	'test group name': function (test) {
		test.expect(1);

		test.equal(1, 1, '1 = 1');
		
		test.done();
	}
};