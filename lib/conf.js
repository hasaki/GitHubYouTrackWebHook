/*jshint globalstrict: true*/
/*global require, module, console, __dirname */
'use strict';

var jf = require('jsonfile');
var util = require('util');
var _ = require('underscore');

module.exports = function (config) {
	var conf = {};
	
	var _config = config || null;
	
	if (_config)
		verifyAndDenormalizeConfig(_config);
	
	// Use this function when you want to test a `value` against a 
	// bunch of regular expression patterns (`array`).  
	// Each pattern will be prefixed with `prefix` if it is passed in
	// Returns true or false
	function matchRegexArray(array, value, arrayProperty, prefix) {
		if (!prefix)
			prefix = '';
		
		return _.some(array, function (pattern) {
			if (arrayProperty)
				pattern = pattern[arrayProperty];

			var re = new RegExp("^" + prefix + pattern + "$", "i");
			return re.test(value);
		});
	}
	
	function isNonEmptyArray(arr) {
		return arr && Array.isArray(arr) && arr.length > 0;
	}

	function verifyAndDenormalizeConfig() {
		if (!_config)
			throw new Error("No configuration found!");

		verifyGitHubConfig();
		verifyYouTrackConfig();
	}

	function verifyYouTrackConfig() {
		var youtrack = _config.youtrack;
		if (!youtrack)
			throw new Error("You must supply a 'youtrack' configuration object");
		
		var projects = _config.youtrack.projects;
		if (!projects || !Array.isArray(projects) || projects.length === 0)
			throw new Error("You must supply at least one project");
		
		if (!isNonEmptyArray(youtrack.committerGroups) && !_.all(projects, function (project) { return isNonEmptyArray(project.committerGroups); }))
			throw new Error("You must either declare a default set of committerGroups through the youtrack.committerGroups property or set the committerGroups property on each project.");
		
		if (youtrack.committerGroups)
			copySettingsToChildren(youtrack.projects, youtrack.committerGroups, 'committerGroups');
	}
	
	function verifyGitHubConfig() {
		var github = _config.github;
		if (!github)
			throw new Error("You must supply a 'github' configuration object");

		var repos = github.repositories;
		if (!repos || !Array.isArray(repos) || repos.length === 0)
			throw new Error("You must supply an array of allowed repositories.");

		if (!isNonEmptyArray(github.branches) && !_.all(repos, function(repo) { return isNonEmptyArray(repo.branches); }))
			throw new Error("You must either declare a default set of branches through the github.branches property or set the branches property on each repository.");

		if (!isNonEmptyArray(github.projects) && !_.all(repos, function(repo) { return isNonEmptyArray(repo.projects); }))
			throw new Error("You must either declare a default set of projects through the github.projects property or set the projects property on each repository.");

		if (github.branches)
			copySettingsToChildren(repos, github.branches, 'branches');

		if (github.projects)
			copySettingsToChildren(repos, github.proejcts, 'projects');
	}
	
	function copySettingsToChildren(children, setting, settingName) {
		if (!children || !Array.isArray(children))
			return;
		
		_.each(children, function (child) {
			if (!child[settingName])
				child[settingName] = setting;
		});
	}

	conf.load = function(path, callback) {
		if (!callback) {
			callback = path;
			path = __dirname + '/config.json';
		}

		jf.readFile(path, 'utf8', function(err, data) {
			if (err) {
				console.error("You must create a 'config.json' file from the provided example");
				throw err;
			}

			_config = data;

			verifyAndDenormalizeConfig();

			if (callback)
				callback(this);
		});
	};

	conf.allowBranch = function(repository, branch) {
		var repo = conf.getRepositoryConfig(repository);
		if (!repo)
			return false;

		return matchRegexArray(repo.branches, branch, null, 'refs\/heads\/');
	};

	conf.allowRepository = function(repo) {
		return matchRegexArray(_config.github.repositories, repo, 'url');
	};

	conf.allowCommand = function(repoUrl, command) {
		var repo = conf.getRepositoryConfig(repoUrl);
		if (!repo)
			return false;

		// extract the project from command
		var match = (/(\w+)\-/i).exec(command);
		if (!match)
			return false;
		var project = match[1];

		return matchRegexArray(repo.projects, project);
	};
	
	// encapsulate the find search, because the repo's can use regular expressions to match
	conf.getRepositoryConfig = function(repoUrl) {
		return _.find(_config.github.repositories, function(repo) {
			return new RegExp('^' + repo.url + '$', 'i').test(repoUrl);
		});
	};

	conf.getProjectConfig = function(project) {
		return _.findWhere(_config.youtrack.projects, { "id": project });
	};

	conf.processDistinct = function() {
		return _config.processDistinct;
	};

	conf.youtrackHost = function() {
		return _config.youtrack.url;
	};

	conf.youtrackUsername = function() {
		return _config.youtrack.user;
	};

	conf.youtrackPassword = function() {
		return _config.youtrack.password;
	};
	
	return conf;
};