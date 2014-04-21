var config = require(__dirname + '/../config/config'),
	qs = require('querystring'),
    http = require('http');
	
exports.getAccessToken = function (data, cb) {
	var req;
	data.app_id = config.app_id;
	req = http.request({
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
			var data = JSON.parse(s);
			switch (response.statusCode) {
				case 200 : cb(null, data.access_token);
				default : cb(data.data);
			}
		});
	});
	req.on('error', function (err) {	
		cb(err);
	});
	req.end();
};

exports.getRequestToken = function (data, cb) {
	var req;
	data.app_id = config.app_id;
	req = http.request({
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
			var data = JSON.parse(s);
			switch (response.statusCode) {
				case 200 : cb(null, data.access_token);
				default : cb(data.data);
			}
		});
	});
	req.on('error', function (err) {	
		cb(err);
	});
	req.end();
};
