var config = require(__dirname + '/../config/config'),
	logger = require(__dirname + '/../lib/logger'),
	curl = require(__dirname + '/../lib/curl'),
	curlToAS = function (method, path, data, scb, ecb) {
		curl.request(method)
			.to(config.auth_server.host, config.auth_server.port, path)
			.send(data)
			.then(scb)
			.onerror(ecb);
	};

exports.login = function (profile, access_token, refresh_token, done) {
	curlToAS('POST', '/auth/login', {
		email : profile.email || profile.emails[0],
		app_id : config.app_id,
		source : 'google',
		google_access_token : access_token
	}, function (status, _data) {
		switch (status) {
			case 200 : return done(null, _data, 0);			// login successful
			case 404 : return done(null, {					// register
				email : profile.email || profile.emails[0],
				google_refresh_token : refresh_token,
				fname : profile._json.given_name,
				lname : profile._json.family_name,
				avatar : profile._json.picture
			}, 1);
		}

		done(data);				// error
	},
	done);
};

exports.getRequestToken = function (data, cb) {
	curlToAS('GET', '/auth/request_token', data,
	function (status, _data) {
		if (status === 200) {
			data.request_token = _data.request_token;
			delete data.scope_token;
			delete data.scopes;
			return cb(null, data);
		}
		cb(JSON.stringify(_data));
	},
	cb);
};

exports.getAccessToken = function (data, cb) {
	var sendRequest = function (err, data) {
		if (err) return cb(err);
		curlToAS('GET', '/auth/access_token', data,
		function (status, data) {
			if (status === 200)
				return cb(null, data.access_token);
			cb(data.data);
		},
		cb);
	};
	data.app_id = config.app_id;
	this.getRequestToken(data, sendRequest);
};


exports.getInfo = function (data, cb) {
	curlToAS('GET', '/user', data,
	function (status, data) {
		if (status === 200)
			return cb(null, data);
		cb(JSON.stringify(data));
	},
	cb);
};

exports.logout = function (data, cb) {
	curlToAS('POST', '/auth/logout', data, cb, cb);
};


exports.addScopes = function (data, scb, ecb) {
	curlToAS('PUT', '/auth/add_self_scopes', data, scb, ecb);
};
