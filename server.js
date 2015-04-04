var http = require('http');
var port = process.env.port || 1337;

var _ = require('underscore');
var util = require('util');

var bareRequest = require('request');
var request = bareRequest.defaults({
	method: 'POST',
	json: true
});

var Youtrack = require('lib/youtrack');
var Conf = require('lib/conf');

var githubHandlerFactory = require('github-webhook-handler');
var handler = githubHandlerFactory({ path: '/webhook', secret: 'hah' });

http.createServer(function (req, res) {
	handler(req, res, function (err) {
		res.statusCode = 404;
		res.end('no such location');
	});
}).listen(port);

handler.on('push', function (event) {
	var payload = event.payload;
	if (payload == null) {
		console.error("Payload is null");
		return;
	}
	
	console.log('Received a push event for %s to %s (%s)',
		payload.repository.name,
		payload.ref,
		payload.commits.length);
	
	var config = new Conf();
	config.load(function () {
		if (!config.repositoryMatches(payload.repository.full_name)) {
			console.log('Repository not allowed!');
			return;
		}
		if (!config.branchMatches(payload.ref)) {
			console.log('Branch not allowed!');
			return;
		}
		
		var youtrack = new Youtrack(request, config);
		youtrack.login(function () {
			_.each(payload.commits, function (commit) {
				processCommit(config, youtrack, commit);
			});
		});
	});
});

handler.on('pull_request', function(event) {
	var payload = event.payload;
	if (payload == null)
		return;

	if (payload.action != 'closed')
		return;
	
	var email = (payload.sender ? payload.sender.email : null);
	if (email == null)
		return;
	var msg = (payload.pull_request ? payload.pull_request.body : null);
	if (msg == null)
		return;
	
	var commands = getCommitCommands(msg);
	if (commands.length == 0)
		return;

	var config = new Conf();
	config.load(function() {
		if (!config.repositoryMatches(payload.repository.full_name)) {
			console.log('Repository not allowed!');
			return;
		}
		if (!config.branchMatches('refs/heads/' + payload.pull_request.base.ref)) {
			console.log('Branch not allowed!');
			return;
		}

		console.log('Pull request accepted! (TODO: PROCESS!)');
	});
});

function processCommit(config, youtrack, commit) {
	if (!commit.distinct || config.processDistinct() == false) {
		console.log('Non-distinct processing not enabled!');
		return;
	}
	
	var commands = getCommitCommands(commit.message);
	if (commands.length == 0)
		return;

	console.log(util.inspect(commit));
	
	youtrack.findUserForEmailAddress(commit.author.email, function (login) {
		if (!login) {
			console.log("Could not get list of users, maybe your login isn't an admin?");
			return;
		}

		_.each(commands, function(commandArray) {
			performCommand(youtrack, commit, login, commandArray);
		});
	});
}

function getCommitCommands(msg) {
	function getIssueCommand(line) {
		var idre = /( |^)#(\w+-\d+)\b/;
		var issueMatch = idre.exec(line);
		if (issueMatch == null)
			return null;
		
		var commandre = /( |^)#\w+-\d+ (.+)/;
		var commandMatch = commandre.exec(line);
		
		var issueid = issueMatch[2];
		var command = commandMatch ? commandMatch[2] : null;
		
		return [issueid, command];
	}
	
	var msgs = msg.split('\n');
	var commands = msgs.map(getIssueCommand);
	
	return _.filter(commands, function (command) { return command != null; });
}

function performCommand(youtrack, commit, login, commandArray) {
	var issueid = commandArray[0];
	var command = commandArray[1] || 'comment';
	var comment = "Commit made by '''" + commit['author']['name'] + "''' on ''" + commit['timestamp'] + "''\n" + commit['url'] + "\n\n{quote}" + commit['message'] + '{quote}';

	console.log('Applying command: ' + issueid + ' : ' + command);
	youtrack.applyCommand(issueid, command, comment, login, function(err) {
		if (err)
			console.error(err);
		else
			console.log('Successfully commented on ' + issueid);
	});
}