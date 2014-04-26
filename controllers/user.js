var config = require(__dirname + '/../config/config'),
    logger = require(__dirname + '/../lib/logger'),
	util = require(__dirname + '/../helpers/util'),
    curl = require(__dirname + '/../lib/curl'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    qs = require('querystring'),
    http = require('http'),
	passport;

exports.setPassport = function (pp) {
	passport = pp;
};

exports.register = function (req, res, next) {
	var data = util.get_data(
		['email', 'lname', 'fname', 'birthdate', 'password'],
		['postal_code', 'google_refresh_token', 'street_address', 'referrer', 'country', 'avatar', 'skype', 'state', 'city'],
		req.body);

	logger.log('info', 'Someone is trying to register');

	if (data instanceof Error) return next(data);
	if (isNaN(data.birthdate = +new Date(data.birthdate)))
		return next(new Error('Invalid birthday'));

	data.app_id = config.app_id;
	logger.log('verbose', data);

	curl.post
		.to(config.auth_server.host, config.auth_server.port, '/user/register')
		.send(data)
		.then(function (statusCode, data) {
			return res.redirect(config.frontend_server_url + (
				statusCode === 200
					? '/login.html'
					: '/failure.html#' + (data.data || data.message)));
		})
		.then(function (err) {
			return res.redirect(config.frontend_server_url + '/failure.html#' + err);
		});
};

exports.update = function (req, res, next) {
	var data = util.get_data(
		['lname', 'fname'],
		['postal_code', 'street_address', 'country', 'avatar', 'skype', 'state', 'city', 'facebook', 'twitter', 'phone'],
		req.body);

	logger.log('info', 'Someone is trying to update profile');

	if (data instanceof Error) return next(data);
	if (!(data.access_token = req.signedCookies.access_token))
		return next(new Error('access_token is missing'));

	curl.put
		.to(config.auth_server.host, config.auth_server.port, '/user')
		.send(data)
		.then(function (statusCode, data) {
			return res.send(data);
		})
		.then(next);
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

	if (!(data.access_token = req.signedCookies.access_token)) {
		return next(new Error('access_token is missing'));
	}
	data.self = true;
	as_helper.getInfo(data, sendResponse);
};

