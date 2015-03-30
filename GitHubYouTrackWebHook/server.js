var http = require('http');
var port = process.env.port || 1337;

var createHandler = require('github-webhook-handler');
var handler = createHandler({ path: '/webhook', secret: 'hah' });

http.createServer(function (req, res) {
	handler(req, res, function(err) {
		res.statusCode = 404;
		res.end('no such location');
	});
}).listen(port);

handler.on('push', function (event) {
	console.log('Received a push event for %s to %s',
		event.payload.repository.name,
		event.payload.ref);
})