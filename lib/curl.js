/**
	Curl.js
*/

var qs = require('querystring'),
    logger = require(__dirname + '/logger'),
    http = require('http'),
	Request = function (method) {
		this.method = method;
		this.to = function (host, port, path) {
			this.host = host;
			this.port = port;
			this.path = path;
			return this;
		};
		this.then = function (cb) {
			if (!this.scb)
				this.scb = cb;
			else
				this.ecb = cb;
			return this;
		};
		this.send = function (data) {
			var headers = {
					'Accept': 'application/json',
					'Content-Type' : 'application/json',
				},
				self = this,
				payload,
				req;

			if (this.method === 'GET')
				this.path += '?' + qs.stringify(data);
			else {
				payload = qs.stringify(data);
				headers = {
					'Content-Type' : 'application/x-www-form-urlencoded',
					'Content-Length' : payload.length
				};
			}

			logger.log('verbose', 'Sending ' + this.method + ' request to ' + this.host + ':' + this.port + this.path);

			if (payload)
				logger.log('silly', 'data\n' + payload);

			req = http.request({
				host: this.host,
				port: this.port,
				path: this.path,
				method: this.method,
				headers: headers
			}, function (response) {
				console.dir(response);
				var s = '';
				response.setEncoding('utf8');
				response.on('data', function (chunk) {
					s += chunk;
				});
				response.on('end', function () {
					logger.log('verbose', 'Request successful', response.statusCode, s);
					self.scb(response.statusCode, JSON.parse(s));
				});
			});

			req.on('error', function (err) {
				logger.log('error', 'Request error', err);
				self.ecb(err);
			});

			if (this.method !== 'GET')
				req.write(payload);

			req.end();
			return this;
		};
	};

module.exports = {
	get : new Request('GET'),
	put : new Request('PUT'),
	post : new Request('POST'),
	delete : new Request('DELETE')
};
