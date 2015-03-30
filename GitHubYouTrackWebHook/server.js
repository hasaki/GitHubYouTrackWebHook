var http = require('http');
var port = process.env.port || 1337;

var createHandler = require('github-webhook-handler');
var handler = createHandler({ path: '/webhook', secret: 'hah' });
var hasCommitCommand = function (message) {
	// iss = #abc-123
	// cmd = fixed assignee luc state testing
	var re = /(?<iss>\#\w+\-\d+)\s(?<cmd>(\w+)+)/i;
	return (message.match(re).length > 0);
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

	console.log('Received a push event for %s to %s',
		payload.repository.name,
		payload.ref);
	
	for (var index = 0; index < payload.commits.length; index++) {
		var commit = payload.commits[index];
		if (hasCommitCommand(commit.message))
			console.log("do stuff here with %s", commit.id);
		else 
			console.log("nothing to do for %s", commit.id);
	}
});
