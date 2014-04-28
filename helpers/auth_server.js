var config = require(__dirname + '/../config/config'),
	logger = require(__dirname + '/../lib/logger'),
	curl = require(__dirname + '/../lib/curl');

exports.getRequestToken = function (data, cb) {
	curl.get
		.to(config.auth_server.host, config.auth_server.port, '/auth/request_token')
		.send(data)
		.then(function (status, _data) {
			if (status === 200) {
				data.request_token = _data.request_token;
				delete data.scope_token;
				delete data.scopes;
				return cb(null, data);
			}
			cb(JSON.stringify(_data));
		})
		.then(function (err) {
			cb(err);
		});
};

exports.getAccessToken = function (data, cb) {
	var sendRequest = function (err, data) {
		if (err) return cb(err);
		curl.get
			.to(config.auth_server.host, config.auth_server.port, '/auth/access_token')
			.send(data)
			.then(function (status, data) {
				if (status === 200)
					return cb(null, data.access_token);
				cb(data.data);
			})
			.then(function (err) {
				cb(err);
			});
	};
	data.app_id = config.app_id;
	this.getRequestToken(data, sendRequest);
};


exports.getInfo = function (data, cb) {
	curl.get
		.to(config.auth_server.host, config.auth_server.port, '/user')
		.send(data)
		.then(function (status, data) {
			if (status === 200)
				return cb(null, data);
			cb(JSON.stringify(data));
		})
		.then(function (err) {
			cb(err);
		});
};

exports.logout = function (data, cb) {
	curl.post
		.to(config.auth_server.host, config.auth_server.port, '/auth/logout')
		.send(data)
		.then(cb)
		.then(cb);
};
