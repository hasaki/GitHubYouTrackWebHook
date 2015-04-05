/*jshint globalstrict: true*/
/*global process, require, __dirname, console */
'use strict';

var http = require('http');
var port = process.env.port || 1337;
var configFile = __dirname + '/config.json';
var secret = process.argv.slice(2)[0] || process.env.GITHUBYOUTRACKSECRET;

var _ = require('underscore');
var util = require('util');
var githubHandlerFactory = require('github-webhook-handler');

var bareRequest = require('request');
var request = bareRequest.defaults({
	method: 'POST',
	json: true
});

var Conf = require('./lib/conf');
var Youtrack = require('./lib/youtrack');

if (!secret) {
	console.log("You must pass in the shared 'secret' to use for the hook or set the GITHUBYOUTRACKSECRET environment variable to the shared secret");
	return;
}
console.log('Using shared secret: %s', secret);

var handler = githubHandlerFactory({ path: '/webhook', secret: secret});

http.createServer(function (req, res) {
	handler(req, res, function (err) {
		res.statusCode = 404;
		res.end('no such location');
	});
}).listen(port);

handler.on('push', function (event) {
	var payload = event.payload;
	if (!payload) {
		pushLog("Payload is null");
		return;
	}
	
	pushLog('Received a push event for %s to %s (%s)',
		payload.repository.name,
		payload.ref,
		payload.commits.length);
	
	var config = new Conf();
	config.load(configFile, function () {
		if (!config.allowRepository(payload.repository.full_name)) {
			pushLog('Repository not allowed!');
			return;
		}
		if (!config.allowBranch(payload.ref)) {
			pushLog('Branch not allowed!');
			return;
		}
		
		var youtrack = new Youtrack(request, config);
		youtrack.login(function () {
			_.each(payload.commits, function (commit) {
				processCommit(config, youtrack, payload.repository.full_name, commit);
			});
		});
	});
});

handler.on('pull_request', function (event) {
	var payload = event.payload;
	if (!payload)
		return;
	var pr = payload.pull_request;
	if (!pr) {
		prLog("Not a PR");
		return;
	}
	
	if (payload.action != 'closed') {
		prLog("pull request isn't closed");
		return;
	}

	if (!payload.pull_request.merged) {
		prLog("pull request was not merged");
		return;
	}
	
	var msg = (pr ? pr.body : null);
	if (!msg) {
		prLog("No body to process");
		return;
	}
	
	var commands = getCommandsFromMessage(msg);
	if (commands.length === 0) {
		prLog("No commands found");
		return;
	}
	
	var config = new Conf();
	config.load(configFile, function () {
		var repo = payload.repository.full_name;
		if (!config.allowRepository(repo)) {
			prLog('Repository not allowed!');
			return;
		}
		
		if (!config.allowBranch(repo, 'refs/heads/' + pr.base.ref)) {
			prLog('Branch not allowed!');
			return;
		}

		var youtrack = new Youtrack(request, config);
		youtrack.login(function() {
			var comment = "Pull request accepted\n" + pr.html_url + "\n\n{quote}" + pr.body + '{quote}';
			_.each(commands, function(commandArray) {
				if (!config.allowCommand(repo, commandArray[0]))
					return;

				performCommand(youtrack, null, commandArray, comment, prLog);
			});
		});
	});
});

function processCommit(config, youtrack, repo, commit) {
	if (!commit.distinct || config.processDistinct() === false) {
		pushLog('Non-distinct processing not enabled!');
		return;
	}
	
	var commands = getCommandsFromMessage(commit.message);
	if (commands.length === 0)
		return;
	
	pushLog(util.inspect(commit));
	
	youtrack.findUserForEmailAddress(commit.author.email, function (login) {
		if (!login) {
			pushLog("Could not get list of users, maybe your login isn't an admin?");
			return;
		}
		
		_.each(commands, function (commandArray) {
			if (!config.allowCommand(commandArray[0]))
				return;
			var comment = "Commit made by '''" + commit.author.name + "''' on ''" + commit.timestamp + "''\n" + commit.url + "\n\n{quote}" + commit.message + '{quote}';
			
			performCommand(youtrack, login, commandArray, comment, pushLog);
		});
	});
}

function getCommandsFromMessage(msg) {
	function getIssueCommand(line) {
		var idre = /( |^)#(\w+-\d+)\b/;
		var issueMatch = idre.exec(line);
		if (issueMatch === null)
			return null;
		
		var commandre = /( |^)#\w+-\d+ (.+)/;
		var commandMatch = commandre.exec(line);
		
		var issueid = issueMatch[2];
		var command = commandMatch ? commandMatch[2] : null;
		
		return [issueid, command];
	}
	
	var msgs = msg.split('\n');
	var commands = msgs.map(getIssueCommand);
	
	return _.filter(commands, function (command) { return command !== null; });
}

function performCommand(youtrack, login, commandArray, comment, logger) {
	var issueid = commandArray[0];
	var command = commandArray[1] || 'comment';
	
	logger('Applying command: ' + issueid + ' : ' + command);
	youtrack.applyCommand(issueid, command, comment, login, function (err) {
		if (err)
			console.error(err);
		else
			logger('Successfully commented on ' + issueid);
	});
}

function log(prefix, args) {
	var line = util.format.apply(util, args);
	console.log('%s: %s', prefix, line);
}

function pushLog() {
	var args = Array.prototype.slice.call(arguments, 0);
	log('push', args);
}

function prLog() {
	var args = Array.prototype.slice.call(arguments, 0);
	log('pr', args);
}