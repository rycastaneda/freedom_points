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

			// remove this after {
			data.request_token = "be593a0203d2595c1ad0827bf7416fb5uLhvuXJT9BEf3MIhfkQDO0uy7moMD7WM";
			delete data.scope_token;
			delete data.scopes;
			return cb(null, data);
			// }

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
				cb(JSON.stringify(data));
			})
			.then(function (err) {
				//remove this after
				return cb(null, 'efd943857915c2b33dcc51e9330a57e785a8aaf8586d0541c8038508f9172d9e');

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
			// remove this after
			return cb(null,
	{"user_data":{"profile_info":{"custom_url":"","avatar":"https://lh4.googleusercontent.com/-8yUvwB-z09E/AAAAAAAAAAI/AAAAAAAAAGQ/jW5Hhr6gQ7A/photo.jpg","paypal":"","fname":"Raven John","lname":"Lagrimas"},"contact_info":{"phone":[],"twitter":"","facebook":"","address":{}},"email":"rjlagrimas08@gmail.com","_id":"8df0532f06b276dbac7b44bad30ac90b","created_at":1398070037332,"updated_at":1398070037332,"is_system_admin":false,"email_confirmed":false},"memory_usage":"{ rss: 45268992, heapTotal: 33179136, heapUsed: 19812736 }","response_time":5,"method":"GET","action":"index","object":"user"});

			cb(err);
		});
};

