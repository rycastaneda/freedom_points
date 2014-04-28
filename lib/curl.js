/**
	Curl.js

	@author	Raven Lagrimas | any.TV
*/

var logger = require(__dirname + '/logger'),
    http = require('http'),
	stringify = function (obj) {
		var ret = [],
			key;
		for (key in obj)
			ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
		return ret.join('&');
	},
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
					'Accept': 'application/json'
				},
				self = this,
				payload,
				req;

			if (this.method === 'GET')
				this.path += '?' + stringify(data);
			else {
				payload = stringify(data);
				headers = {
					'Content-Type' : 'application/x-www-form-urlencoded',
					'Content-Length' : payload.length
				};
			}

			logger.log('verbose', this.method + ' ' + this.host + ':' + this.port + this.path);

			if (payload)
				logger.log('silly', 'data\n' + payload);

			req = http.request({
				host: this.host,
				port: this.port,
				path: this.path,
				method: this.method,
				headers: headers
			}, function (response) {
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
	get : {
		to : function (host, port, path) {
			return new Request('GET').to(host, port, path);
		}
	},
	post : {
		to : function (host, port, path) {
			return new Request('POST').to(host, port, path);
		}
	},
	put : {
		to : function (host, port, path) {
			return new Request('PUT').to(host, port, path);
		}
	},
	delete : {
		to : function (host, port, path) {
			return new Request('DELETE').to(host, port, path);
		}
	},
};
