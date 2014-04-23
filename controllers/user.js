var config = require(__dirname + '/../config/config'),
    logger = require(__dirname + '/../lib/logger'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    qs = require('querystring'),
    http = require('http'),
	passport;

exports.setPassport = function (pp) {
	passport = pp;
};

exports.register = function (req, res, next) {
	var data = util.chk_rqd(['email', 'lname', 'fname', 'birthdate', 'password'], req.body, next),
		relayToAS = function (data) {
			var payload = qs.stringify(data),
                req = http.request({
                    host: config.auth_server.host,
                    port: config.auth_server.port,
                    path: '/user/register',
                    method: 'POST',
                    headers : {
                        'Content-Type' : 'application/x-www-form-urlencoded',
                        'Content-Length' : payload.length
                    }
                }, function (response) {
					var s = '';
                    response.setEncoding('utf8');
                    response.on('data', function (chunk) {
						s += chunk;
                    });
                    response.on('end', function () {
                        var data = JSON.parse(s);
						logger.log('info', 'register : done sending request to AS');
						console.dir(data);
						console.dir(response.statusCode);
						if (response.statusCode === 200) {
							return res.redirect(config.frontend_server_url + '/login.html');
						}
						return res.redirect(config.frontend_server_url + '/failure.html#' + (data.data || data.message));
                    });
                });
            req.on('error', function (err) {
                console.log('Unable to connect to auth server');
				console.dir(err);
				return res.redirect(config.frontend_server_url + '/failure.html#' + err);
            });
            req.write(payload);
            req.end();
			logger.log('info', 'register : sending request to AS');
        };

	if (!data) return;

	if (isNaN(data.birthdate = +new Date(data.birthdate))) {
		return next(new Error('Invalid birthday'));
	}

	data.app_id = config.app_id;
	req.body.postal_code && !isNaN(req.body.postal_code) && (data.postal_code = req.body.postal_code);
	req.body.google_refresh_token && (data.google_refresh_token = req.body.google_refresh_token);
	req.body.street_address && (data.street_address = req.body.street_address);
	req.body.referrer && (data.referrer = req.body.referrer);
	req.body.country && (data.country = req.body.country);
	req.body.avatar && (data.avatar = req.body.avatar);
	req.body.skype && (data.skype = req.body.skype);
	req.body.state && (data.state = req.body.state);
	req.body.city && (data.city = req.body.city);

	logger.log('verbose', data);

	relayToAS(data);
};

exports.auth_google = function () {
	return passport.authenticate('google', {
		scope : ['profile', 'email'],
		approvalPrompt : 'force',
		accessType : 'offline'
	});
};

exports.auth_google_callback = function (req, res, next) {
	passport.authenticate('google', function (err, user, info) {
		var sendResponse = function (err, data) {
			if (err) return next(err);
			res.cookie('access_token', data, { signed : true });
			return res.redirect(config.frontend_server_url + '/#/overview');
		};

		switch (info) {
			case 0 :
				as_helper.getAccessToken({
					user_id : user.user_data._id,
					scope_token : user.scope_token,
					scopes : 'self.view'
				}, sendResponse);
				break;
			case 1 :
				res.cookie('data', JSON.stringify(user));
				return res.redirect(config.frontend_server_url + '/#/registration');
			default :
				res.cookie('error', err);
				return res.redirect(config.frontend_server_url + '/#/error');
		}

	})(req, res, next);
};



exports.info = function (req, res, next) {
	var data = {},
		sendResponse = function (err, data) {
			if (err) return next(err);
			res.send(data.user_data);
		};
	console.dir(req.signedCookies);

	if (!(data.access_token = req.signedCookies.access_token)) {
		return next(new Error('access_token is missing'));
	}
	data.self = true;
	as_helper.getInfo(data, sendResponse);
};

