'use strict';

var _ = require('underscore');
var Conf = require('../lib/conf.js');

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

function getBasicConfig() {
	return {
		github: {
			repositories: [
				{ url: 'hasaki/Test', branches: ['master'] }
			]
		},
		youtrack: {
			url: 'http://example.org/',
			user: 'root',
			password: 'secret',
			projects: [
				{ id: 'PRJ', committersGroup: ['All Users'] }
			]
		}
	};
}

exports['conf'] = {
	setUp: function (done) {
		// setup here
		done();
	},
	'basic config passes': function (test) {
		test.expect(1);
		
		test.doesNotThrow(function () { return new Conf(getBasicConfig()); }, 'The basic config should not throw');
		
		test.done();
	},
	'github config errors': function(test) {
		function testIt(msg) {
			test.throws(function () { return new Conf(config); }, null, msg);		
		}

		test.expect(3);
		
		var config = getBasicConfig();
		delete config.github;
		testIt('Should throw when the main github property is missing');

		config = getBasicConfig();
		config.github.repositories = [];
		testIt('Should throw when there are no repositories');

		config = getBasicConfig();
		_.each(config.github.repositories, function(repo) {
			delete repo.branches;
		});
		delete config.github.branches;
		testIt('Should throw when no repos define branches and there isnt a global branches option set');
		
		test.done();
	}
};