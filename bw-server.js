var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	fs = require('fs')
	mongo = require('mongoskin'),
	db = mongo.db('mongodb://localhost:27017/crawled'),
	collection = db.collection('channels');

io.set('browser client minification', true);
// io.set('browser client gzip', true);
io.set('log level', 0);

app.listen(8002);

function handler (req, res) {
	fs.readFile(__dirname + '/crawler/index.html', function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}

io.sockets.on('connection', function (socket) {
	var emitCount = function () {
		collection.count(function (err, count) {
			if (err) return console.dir(err);
			io.sockets.emit('count', count);
		});
	};
	socket.on('count', emitCount);
	socket.on('insert', function (data) {
		collection.insert(data, function (err) {
			if (err && err.code === 11000) return console.log('duplicate');
			if (err) return console.dir(err);
			console.log('Inserted ' + data.username);
			emitCount();
		});
	});
	socket.on('error', function (err) {
		console.dir(err);
	});
});
