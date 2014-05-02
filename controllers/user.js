var config = require(__dirname + '/../config/config'),
    logger = require(__dirname + '/../lib/logger'),
	util = require(__dirname + '/../helpers/util'),
    curl = require(__dirname + '/../lib/curl'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
	googleapis = require('googleapis'),
    OAuth2 = googleapis.auth.OAuth2,
    qs = require('querystring'),
    http = require('http');

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
		.then(next);
};

exports.update = function (req, res, next) {
	var data = req.body;
	data.access_token = req.signedCookies.access_token

	logger.log('info', 'Someone is trying to update profile');

	curl.put
		.to(config.auth_server.host, config.auth_server.port, '/user')
		.send(data)
		.then(res.send.bind(res))
		.then(next);
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

exports.auth_channel = function (req, res, next) {
	res.redirect(oauth2Client.generateAuthUrl({
		state : 'channel',
		access_type: 'offline',
		approval_prompt : 'force',
		scope : [
			'https://www.googleapis.com/auth/youtube',
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/yt-analytics.readonly',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
			'https://www.googleapis.com/auth/youtubepartner',
			'https://www.googleapis.com/auth/youtube.readonly',
			'https://www.googleapis.com/auth/youtubepartner-channel-audit'
		].join(' ')
	}));
};

exports.auth_callback = function (req, res, next) {
	if (req.query.state === 'google')
		exports.auth_google_callback(req, res, next);
	else
		exports.auth_youtube_callback(req, res, next);
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
			switch (info) {
				case 0 :
					as_helper.getAccessToken({
						user_id : user.user_data._id,
						scope_token : user.scope_token,
						scopes : 'self.view,self.edit'
					}, sendResponse);
					break;
				case 1 :
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



exports.auth_youtube_callback = function (req, res, next) {
	var tokens,
		redirect = function (err, response) {
			if (err) return next(err);
			res.cookie('channels', JSON.stringify(response.items));
			res.redirect(config.frontend_server_url + '/channels');
		},
		getClient = function(err, client) {
			if (err) return next(err);
			client.youtube.channels.list({
					part : 'id, snippet, auditDetails, brandingSettings, contentDetails, invideoPromotion, statistics, status, topicDetails',
					mine : true
				})
				.execute(redirect);
		},
		getTokens = function(err, _tokens) {
			if (err) return next(err);
			tokens = _tokens;
			oauth2Client.setCredentials(_tokens);
			googleapis
				.discover('youtube', 'v3')
				.withAuthClient(oauth2Client)
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
	var data = {},
		sendResponse = function (err, data) {
			if (err) return next(err);
			res.send(data.user_data);
		};

	if (!(data.access_token = req.signedCookies.access_token))
		return next('access_token is missing');

	data.self = true;
	as_helper.getInfo(data, sendResponse);
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

