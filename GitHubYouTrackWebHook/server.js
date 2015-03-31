var http = require('http');
var port = process.env.port || 1337;
var _ = require('underscore');

var createHandler = require('github-webhook-handler');
var handler = createHandler({ path: '/webhook', secret: 'hah' });
var branchPattern = "(master|f\-.+)$";

var isMasterOrFeatureBranch = function (branchName) {
	// refs/heads/master
	// refs/heads/f-somefeature
	var re = /(master|f\-.+)$/i;
	return branchName.match(re);
};

var hasCommitCommand = function (message) {
	// (space)#abc-123(space)
	var re = /\s(\#\w+\-\d+)\s/i;
	return message.match(re);
};

var linkToYouTrack = function (commit) {

	console.log("DO STUFF HERE: %s", commit.id.substr(0, 7));
};

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
	
	if (!isMasterOrFeatureBranch(payload.ref)) {
		console.log('Do not process commits!');
		return;
	}

	var youTrackCommits = _.filter(payload.commits, function(commit) {
		return commit.distinct && hasCommitCommand(commit.message);
	});
	
	if (youTrackCommits.length == 0) {
		console.log('No commits refer to cases in YouTrack');
		return;
	}

	_.each(youTrackCommits, linkToYouTrack);

});
