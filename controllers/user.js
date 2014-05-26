var config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
    logger = require(__dirname + '/../lib/logger'),
    curl = require(__dirname + '/../lib/curl'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
	googleapis = require('googleapis'),
    OAuth2 = googleapis.auth.OAuth2;

oauth2Client = new OAuth2(config.googleAuth.clientID, config.googleAuth.clientSecret, config.googleAuth.callbackURL);

exports.register = function (req, res, next) {
	var data = req.body;
	data.app_id = config.app_id;

	logger.log('info', 'Someone is trying to register');
	res.clearCookie('data');

	curl.post
		.to(config.auth_server.host, config.auth_server.port, '/user/register')
		.send(data)
		.then(res.send.bind(res))
		.onerror(next);
};

exports.update = function (req, res, next) {
	var data = req.body;
	data.access_token = req.signedCookies.access_token

	logger.log('info', 'Someone is trying to update profile');

	curl.put
		.to(config.auth_server.host, config.auth_server.port, '/user')
		.send(data)
		.then(res.send.bind(res))
		.onerror(next);
};

exports.auth_google = function (req, res, next) {
	res.redirect(oauth2Client.generateAuthUrl({
		state : 'google',
		access_type: 'offline',
		approval_prompt : 'force',
		scope : [
			'profile',
			'email',
			'https://www.googleapis.com/auth/youtube.readonly'
		].join(' ')
	}));
};

exports.auth_google_callback = function (req, res, next) {
	var tokens,
		sendResponse = function (err, data) {
			if (err) return next(err);
			res.cookie('access_token', data, { signed : true });
			res.redirect(config.frontend_server_url + '/overview');
		},
		done = function (err, user, info) {
			if (err) return next(err);
			console.log(user);
			console.log(info);

			switch (info) {
				case 0 :
					as_helper.getAccessToken({
						user_id : user.user_data._id,
						scope_token : user.scope_token,
						scopes : config.scopes.all
//						+ ',' + config.scopes.staff
					}, sendResponse);
					break;
				case 1 :
					if (~user.email.indexOf('@pages.plusgoogle.com'))
						user.email = '';
					res.cookie('data', JSON.stringify(user));
					res.redirect(config.frontend_server_url + '/register');
			}
		},
		loginToAS = function (err, response) {
			if (err) return next(err);
			as_helper.login(response, tokens.access_token, tokens.refresh_token, done)
		},
		getClient = function (err, client) {
			if (err) return next(err);
			client
				.oauth2.userinfo.get()
				.withAuthClient(oauth2Client)
				.execute(loginToAS);
		},
		getTokens = function(err, _tokens) {
			if (err) return next(err);
			tokens = _tokens;
			oauth2Client.setCredentials(_tokens);
			googleapis
				.discover('oauth2', 'v2')
				.execute(getClient);
		};

	// @override
	next = function (err) {
		res.cookie('error', err);
		res.redirect(config.frontend_server_url + '/error');
	};

	oauth2Client.getToken(req.query.code, getTokens);
};

exports.info = function (req, res, next) {
	if (!req.signedCookies.access_token)
		return next('access_token is missing');
	res.send(req.user.user_data);
};

exports.logout = function (req, res, next) {
	logger.log('info', 'Someone is logging out');
	as_helper.logout({
		access_token : req.signedCookies.access_token,
		app_id : config.app_id
	}, function () {
		res.clearCookie('access_token');
		res.send({message : 'Logout successful'});
	});
};

exports.staff = function (req, res, next) {
	var updateAppData = function () {
			as_helper.updateAppData({
				user_id : req.user_id,
				access_token : req.signedCookies.access_token,
				app_data : {
					role : 'Staff'
				}
			}, res.send.bind(res), next);
		};

	logger.log('info', 'Someone wants to be a staff');

	as_helper.addScopes({
		access_token : req.signedCookies.access_token,
		user_id : req.user_id,
		scopes : config.scopes.all + ',' + config.scopes.staff + ',' + config.scopes.payout
	}, updateAppData, next);
};


exports.partner = function (req, res, next) {
	var updateAppData = function () {
			as_helper.updateAppData({
				access_token : req.signedCookies.access_token,
				user_id : req.user_id,
				app_data : {
					role : 'Partner'
				}
			}, res.send.bind(res), next);
		};

	logger.log('info', 'Someone wants to be a partner');

	as_helper.addScopes({
		access_token : req.signedCookies.access_token,
		user_id : req.user_id,
		scopes : config.scopes.all + ',' + config.scopes.staff + ',' + config.scopes.channel + ',' + config.scopes.payout
	}, updateAppData, next);
};
