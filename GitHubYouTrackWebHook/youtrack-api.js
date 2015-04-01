var bareRequest = require('request');
var request = bareRequest.defaults({
	method: 'POST',
	json: true
});

var encode = encodeURIComponent;

module.exports = function (config) {
	var youtrack = {};
	
	var _config = config;
	var _jar = request.jar();
	var _loggedin = false;
	
	function queryYoutrack(method, host, path, data, cb) {
		if (cb == null) {
			cb = data;
			data = {};
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
		
		if (method == 'POST')
			payload.form = data;

		request(payload, cb);
	}
	
	youtrack.config = function (config) {
		if (arguments.length)
			_config = config;
		
		return _config;
	}
	
	youtrack.login = function (callback) {
		if (_loggedin) {
			callback(null, youtrack);
			return;
		}
		
		var path = '/rest/user/login?login=' + encode(_config.youtrackUsername()) + '&password=' + encode(_config.youtrackPassword());
		
		queryYoutrack('POST', _config.youtrackHost(), path, function (err, res) {
			if (err) {
				callback(err);
			} else {
				_loggedin = true;
				callback(null, youtrack);
			}
		});
	}
	
	/*
	counter = 0
	found_user = nil
	while true
	  body = ''
	  res = http_get 'rest/admin/user', :q => email, :group => data['committers'], :start => counter
	  verify_response(res)
	  xml_body = REXML::Document.new(res.body)
	  xml_body.root.each_element do |user_ref|
		res = http_get "rest/admin/user/#{user_ref.attributes['login']}"
		verify_response(res)
		attributes = REXML::Document.new(res.body).root.attributes
		if attributes['email'].upcase == email.upcase || (attributes['jabber'] ? attributes['jabber'].upcase == email.upcase : false)
		  return if !found_user.nil?
		  found_user = user_ref.attributes['login']
		end
	  end
	  return found_user if xml_body.root.elements.size < 10
	  counter += 10
	end
	 */
	youtrack.findUserForEmailAddress = function (email, callback) {
		youtrack.queryUsers(email, function (err, users) {
			if (err)
				callback(null);
			else if (Array.isArray(users) && users.length == 1)
				callback(users[0].login);
			else
				callback(config.youtrackUsername());
		});
	}
	
	youtrack.applyCommand = function (id, command, comment, runAs, callback) {
		if (runAs == null)
			runAs = _config.youtrackUsername();

		var path = '/rest/issue/' + encode(id) + '/execute';
		var data = {
			command: command,
			comment: comment,
			runAs: runAs
		};

		queryYoutrack('POST', _config.youtrackHost(), path, data, function (err, res) {
			var arg = null;
			
			if (err)
				arg = err;
			else if (res.statusCode != 200)
				arg = new Error('Error applying command to issue');
			
			if (callback)
				callback(arg);
		});
	}
	
	youtrack.issueExists = function (id, callback) {
		var path = '/rest/issue/' + encode(id) + '/exists';
		queryYoutrack('GET', _config.youtrackHost(), path, function (err, res) {
			var args = null;
			
			if (err)
				args = [err];
			else
				args = [null, (res.statusCode === 200)];
			
			if (callback)
				callback.apply(youtrack, args);
		});
	}
	
	youtrack.queryUsers = function (query, callback) {
		var path = '/rest/admin/user?q=' + encode(query);
		console.log('searching for users: ' + query);
		
		queryYoutrack('GET', _config.youtrackHost(), path, function (err, res, body) {
			var args = null;
			
			if (err)
				args = [err];
			else if (res.statusCode === 200)
				args = [null, body];
			else
				args = [null, []];

			console.log('reporting query status');
			console.log(args);
										
			if (callback)
				callback.apply(youtrack, args);
		});
	}
	
	return youtrack;
};
