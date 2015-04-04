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
		if (prefix == null)
			prefix = '';
		
		return _.some(array, function (pattern) {
			if (arrayProperty)
				pattern = pattern[arrayProperty];

			var re = new RegExp("^" + prefix + pattern + "$", "i");
			return re.test(value);
		});
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
		if (!projects || !Array.isArray(projects) || projects.length == 0)
			throw new Error("You must supply at least one project");
		
		if (youtrack.committerGroups)
			copySettingsToChildren(youtrack.projects, youtrack.committerGroups, 'committerGroups');
	}
	
	function verifyGitHubConfig() {
		var github = _config.github;
		if (!github)
			throw new Error("You must supply a 'github' configuration object");

		var repos = github.repositories;
		if (!repos || !Array.isArray(repos) || repos.length == 0)
			throw new Error("You must supply an array of allowed repositories.");

		if (!github.branches && !_.all(repos, function(repo) { return repo.branches != null && Array.isArray(repo.branches) && repo.branches.length > 0; }))
			throw new Error("You must either declare a default set of branches through the github.branches property or set the branches property on each repository.");

		if (github.branches)
			copySettingsToChildren(repos, github.branches, 'branches');
	}
	
	function copySettingsToChildren(children, setting, settingName) {
		if (!children || !Array.isArray(children))
			return;
		
		_.each(children, function (child) {
			if (!child[settingName])
				child[settingName] = setting;
		});
	}
	
	conf.load = function (path, callback) {
		if (callback == null) {
			callback = path;
			path = __dirname + '/config.json';
		}

		jf.readFile(path, 'utf8', function (err, data) {
			if (err) {
				console.error("You must create a 'config.json' file from the provided example");
				throw err;
			}
			
			_config = data;

			verifyAndDenormalizeConfig();
			
			if (callback)
				callback(this);
		});
	}
	
	conf.branchMatches = function (branch) {
		return matchRegexArray(_config.github.branches, branch, null, 'refs\/heads\/');
	}
	
	conf.repositoryMatches = function (repo) {
		return matchRegexArray(_config.github.repositories, repo, 'url');
	}
	
	conf.getProjectConfig = function (project) {
		return _.findWhere(_config.youtrack.projects, { "id": project });
	}
	
	conf.processDistinct = function () {
		return _config.processDistinct;
	}
	
	conf.youtrackHost = function () {
		return _config.youtrack.url;
	}
	
	conf.youtrackUsername = function () {
		return _config.youtrack.user;
	}
	
	conf.youtrackPassword = function () {
		return _config.youtrack.password;
	}
	
	return conf;
};