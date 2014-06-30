var config = require(__dirname + '/../config/config'),
	logger = require(__dirname + '/../lib/logger'),
	curl = require(__dirname + '/../lib/curl'),
	curl_to_AS = function (method, path, data, scb, ecb) {
		curl.request(method)
			.to(config.auth_server.host, config.auth_server.port, path)
			.send(data)
			.then(scb)
			.onerror(ecb);
	};

exports.login = function (profile, access_token, refresh_token, done) {
	curl_to_AS('POST', '/auth/login', {
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
				fname : profile.given_name || '',
				lname : profile.family_name || '',
				avatar : profile.picture
			}, 1);
		}

		done(data);				// error
	},
	done);
};

exports.get_request_token = function (data, cb) {
	curl_to_AS('GET', '/auth/request_token', data,
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

exports.get_access_token = function (data, cb) {
	var sendRequest = function (err, data) {
		if (err) return cb(err);
		curl_to_AS('GET', '/auth/access_token', data,
		function (status, data) {
			if (status === 200)
				return cb(null, data.access_token);
			cb(data.data);
		},
		cb);
	};
	data.app_id = config.app_id;
	this.get_request_token(data, sendRequest);
};


exports.get_info = function (data, cb) {
	curl_to_AS('GET', '/user', data,
	function (status, data) {
		if (status === 200 && data.users.length === 1) {
			data.users[0].app_data = data.users[0]['data_' + config.app_id];
			delete data.users[0]['data_' + config.app_id];
			return cb(null, data.users[0]);
		}
		cb(JSON.stringify(data));
	},
	cb);
};

exports.logout = function (data, cb) {
	curl_to_AS('POST', '/auth/logout', data, cb, cb);
};


exports.add_self_scopes = function (data, scb, ecb) {
	curl_to_AS('PUT', '/auth/add_self_scopes', data, scb, ecb);
};


exports.add_scopes = function (data, scb, ecb) {
	curl_to_AS('PUT', '/auth/add_scopes', data, scb, ecb);
};


exports.has_scopes = function (access_token, scopes, scb, ecb) {
	curl_to_AS('GET', '/auth/has_scopes', {
		access_token : access_token,
		scopes : scopes
	}, scb, ecb);
};


exports.update_app_data = function (data, scb, ecb) {
	data.app_id = config.app_id;
	data.app_data = JSON.stringify(data.app_data);
	curl_to_AS('POST', '/app/own_app_data', data, scb, ecb);
};

exports.get_users = function (access_token, filter, scb, ecb) {
	filter.access_token = access_token;
	curl_to_AS('GET', '/user', filter, function (status, data) {
		if (data.users) {
			data.users = data.users.map(function (a) {
				a.app_data = a['data_' + config.app_id];
				delete a['data_' + config.app_id];
				return a;
			})
		}
		scb(status, data.users || data);
	}, ecb);
};
