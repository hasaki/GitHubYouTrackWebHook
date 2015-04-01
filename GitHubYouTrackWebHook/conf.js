var jf = require('jsonfile');
var util = require('util');
var _ = require('underscore');

module.exports = function() {
	var conf = {};

	var _config = null;
	var _matchRegexArray = function (array, value, prefix) {
		if (prefix == null)
			prefix = '';

		return _.some(array, function(pattern) {
			var re = new RegExp("^" + prefix + pattern + "$", "i");
			return re.test(value);
		});
	};

	conf.load = function(callback) {
		jf.readFile(__dirname + '/config.json', 'utf8', function(err, data) {
			if (err) {
				console.error("You must create a 'config.json' file from the provided example");
				throw err;
			}

			_config = data;

			if (callback)
				callback(this);
		});
	}

	conf.branchMatches = function(branch) {
		return _matchRegexArray(_config.github.branches, branch, 'refs\/heads\/');
	}

	conf.repositoryMatches = function(repo) {
		return _matchRegexArray(_config.github.repositories, repo);
	}
	
	conf.processDistinct = function() {
		return _config.processDistinct;
	}
	
	conf.youtrackHost = function() {
		return _config.youtrack.url;
	}
	
	conf.youtrackUsername = function() {
		return _config.youtrack.user;
	}
	
	conf.youtrackPassword = function() {
		return _config.youtrack.password;
	}

	return conf;
};