/*jshint globalstrict: true*/
/*global require, exports */

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
			branches: ['master', 'feature/.*', 'foo'],
			repositories: [
				{ url: 'hasaki/HookTesting', branches: ['master', 'feature/.*'], projects: ['PRJA'] },
				{ url: 'wildcard/.*', branches: ['foo'], projects: ['PRJB'] }
			]
		},
		youtrack: {
			url: 'http://example.org/',
			user: 'root',
			password: 'secret',
			committerGroups: ['All Developers'],
			projects: [
				{ id: 'PRJA', committerGroups: ['All Users'] },
				{ id: 'PRJB' }
			]
		}
	};
}

exports.conf = {
	setUp: function (done) {
		// setup here
		done();
	},
	'basic config passes': function (test) {
		test.expect(1);
		
		test.doesNotThrow(function () { return new Conf(getBasicConfig()); }, 'The basic config should not throw');
		
		test.done();
	},
	'github config errors': function (test) {
		function testIt(msg) {
			test.throws(function () { return new Conf(config); }, null, msg);
		}
		
		test.expect(4);
		
		var config = getBasicConfig();
		delete config.github;
		testIt('Should throw when the main github property is missing');
		
		config = getBasicConfig();
		config.github.repositories = [];
		testIt('Should throw when there are no repositories');
		
		config = getBasicConfig();
		_.each(config.github.repositories, function (repo) {
			delete repo.branches;
		});
		delete config.github.branches;
		testIt('Should throw when no repos define branches and there isnt a global branches option set');
		
		config = getBasicConfig();
		_.each(config.github.repositories, function (repo) {
			delete repo.projects;
		});
		delete config.github.projects;
		testIt('Should throw when no repos define projects and there isnt a global projects option set');
		
		test.done();
	},
	'youtrack config errors': function (test) {
		function testIt(msg) {
			test.throws(function () { return new Conf(config); }, null, msg);
		}
		
		test.expect(3);
		
		var config = getBasicConfig();
		delete config.youtrack;
		testIt('Should throw when the main youtrack property is missing');
		
		config = getBasicConfig();
		config.youtrack.projects = [];
		testIt('Should throw when there are no projects');
		
		config = getBasicConfig();
		_.each(config.youtrack.projects, function (project) {
			delete project.committerGroups;
		});
		delete config.youtrack.committerGroups;
		testIt('Should throw when no projects define committerGroups and there isnt a global committerGroups option set');
		
		test.done();
	},
	'repo tests': function (test) {
		test.expect(3);
		
		var config = new Conf(getBasicConfig());
		
		test.ok(config.allowRepository('hasaki/HookTesting'), 'hasaki/HookTesting is configured');
		test.ok(!config.allowRepository('hasaki/HookTesting2'), 'hasaki/HookTesting2 is not configured');
		test.ok(config.allowRepository('wildcard/HookTesting'), 'wildcard/* is configured');
		
		test.done();
	},
	'branch tests': function (test) {
		test.expect(3);

		var repo = 'hasaki/HookTesting';
		var config = new Conf(getBasicConfig());
		
		// branch from PRs and pushes will be in the format refs/heads/<branch>
		test.ok(config.allowBranch(repo, 'refs/heads/master'), "master branch matches");
		test.ok(config.allowBranch(repo, 'refs/heads/feature/foo'), "feature/foo branch matches because of the feature/* wildcard");
		test.ok(!config.allowBranch(repo, 'refs/heads/foo'), "foo doesn't match (its not on this repo)");
		
		test.done();
	},
	'command tests': function(test) {
		test.expect(3);

		var repoA = 'hasaki/HookTesting';
		var repoB = 'wildcard/Something';

		var config = new Conf(getBasicConfig());

		test.ok(config.allowCommand(repoA, 'PRJA-234'), 'PRJA is allowed on hasaki/HookTesting repo');
		test.ok(config.allowCommand(repoB, 'PRJB-123'), 'PRJB is allowed on all wildcard repos');
		test.ok(!config.allowCommand(repoB, 'PRJA-123'), 'PRJA is not allowed on the wildcard repos');

		test.done();
	}
};