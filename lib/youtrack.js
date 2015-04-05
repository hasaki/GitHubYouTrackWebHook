/*jshint globalstrict: true*/
/*global require, module */
'use strict';

var encode = encodeURIComponent;

module.exports = function (request, config) {
	var youtrack = {};
	
	var _config = config;
	var _request = request;
	var _jar = request.jar();
	var _loggedin = false;

	function queryYoutrack(method, host, path, data, cb) {
		if (!cb && typeof data === "function") {
			cb = data;
			data = null;
		} 

		var payload = {
			method: method,
			url: host + path,
			jar: _jar,
			json: true,
			headers: {
				'Accept-Content': 'application/json'
			}
		};
		
		if (data)
			payload.form = data;

		_request(payload, cb);
	}

	youtrack.config = function(config) {
		if (arguments.length)
			_config = config;

		return _config;
	};

	youtrack.login = function(callback) {
		if (_loggedin) {
			callback(null, youtrack);
			return;
		}

		var path = '/rest/user/login';
		var data = {
			login: _config.youtrackUsername(),
			password: _config.youtrackPassword()
		};

		queryYoutrack('POST', _config.youtrackHost(), path, data, function(err, res) {
			if (err) {
				callback(err);
			} else {
				_loggedin = true;
				callback(null, youtrack);
			}
		});
	};

	youtrack.findUserForEmailAddress = function(email, callback) {
		youtrack.queryUsers(email, function(err, users) {
			if (err)
				callback(null);
			else if (Array.isArray(users) && users.length == 1)
				callback(users[0].login);
			else
				callback(null);
		});
	};

	youtrack.applyCommand = function(id, command, comment, runAs, callback) {
		if (!runAs)
			runAs = _config.youtrackUsername();

		var path = '/rest/issue/' + encode(id) + '/execute';
		var data = {
			command: command,
			comment: comment,
			runAs: runAs
		};

		queryYoutrack('POST', _config.youtrackHost(), path, data, function(err, res) {
			var arg = null;

			if (err)
				arg = err;
			else if (res.statusCode != 200)
				arg = new Error('Error applying command to issue');

			if (callback)
				callback(arg);
		});
	};

	youtrack.issueExists = function(id, callback) {
		var path = '/rest/issue/' + encode(id) + '/exists';
		queryYoutrack('GET', _config.youtrackHost(), path, function(err, res) {
			var args = err ? [err] : [null, (res.statusCode === 200)];

			if (callback)
				callback.apply(youtrack, args);
		});
	};

	youtrack.queryUsers = function (query, group, callback) {
		if (!callback && typeof group === "function") {
			callback = group;
			group = '';
		}
		
		// todo: use the group to narrow users down
		var path = '/rest/admin/user?q=' + encode(query);

		queryYoutrack('GET', _config.youtrackHost(), path, function(err, res, body) {
			var args;

			if (err)
				args = [err];
			else if (res.statusCode === 200)
				args = [null, body];
			else
				args = [null, []];

			if (callback)
				callback.apply(youtrack, args);
		});
	};
	
	return youtrack;
};
