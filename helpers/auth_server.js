var config = require(__dirname + '/../config/config'),
	logger = require(__dirname + '/../lib/logger'),
	qs = require('querystring'),
    http = require('http');

exports.getRequestToken = function (data, cb) {
	var req = http.request({
		host: config.auth_server.host,
		port: config.auth_server.port,
		path: '/auth/request_token?' + qs.stringify(data),
		method: 'GET'
	}, function (response) {
		var s = '';
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			s += chunk;
		});
		response.on('end', function () {
			var _data = JSON.parse(s);

			logger.log('info', 'Done getting request token');
			logger.log('verbose', s);

			if (response.statusCode === 200) {
				data.request_token = _data.request_token;
				delete data.scope_token;
				delete data.scopes;
				return cb(data);
			}

			logger.log('error', 'Error on getting request token : ' + s);
			cb();
		});
	});
	req.on('error', function (err) {
		logger.log('error', 'Error on getting request token : ' + err);
		cb();
	});
	req.end();
	logger.log('info',
		'Getting request from '
		+ config.auth_server.host
		+ ':'
		+ config.auth_server.port
		+ '/auth/request_token?'
		+ qs.stringify(data)
	);
};

exports.getAccessToken = function (data, cb) {
	var sendRequest = function (data) {
			var req = http.request({
				host: config.auth_server.host,
				port: config.auth_server.port,
				path: '/auth/access_token?' + qs.stringify(data),
				method: 'GET'
			}, function (response) {
				var s = '';
				response.setEncoding('utf8');
				response.on('data', function (chunk) {
					s += chunk;
				});
				response.on('end', function () {
					var _data = JSON.parse(s);

					logger.log('info', 'Done getting access token');
					logger.log('verbose', s);

					if (response.statusCode === 200) {
						return cb(null, _data.access_token);
					}

					logger.log('error', 'Error on getting request token : ' + s);
					cb(s);
				});
			});
			req.on('error', function (err) {
				logger.log('error', 'Error on getting request token : ' + err);
				cb(err);
			});
			req.end();
			logger.log('info', 'Getting access token');
		};
	data.app_id = config.app_id;
	this.getRequestToken(data, sendRequest);
};


exports.getInfo = function (data, cb) {
	var req = http.request({
		host: config.auth_server.host,
		port: config.auth_server.port,
		path: '/user?' + qs.stringify(data),
		method: 'GET'
	}, function (response) {
		var s = '';
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			s += chunk;
		});
		response.on('end', function () {
			var _data = JSON.parse(s);

			logger.log('info', 'Done getting user info in AS');
			logger.log('verbose', s);

			if (response.statusCode === 200) {
				logger.log('info', 'Done getting access token');
				return cb(null, _data);
			}

			logger.log('error', 'Error on getting user info : ' + s);
			cb(s);
		});
	});
	req.on('error', function (err) {
		logger.log('error', 'Error on getting user info in AS : ' + err);
		cb(err);
	});
	req.end();
	logger.log('info', 'Getting user info in AS from'
		+ config.auth_server.host
		+ ':'
		+ config.auth_server.port
		+ '/user?'
		+ qs.stringify(data)
	);
};

