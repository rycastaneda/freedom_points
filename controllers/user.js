var config = require(__dirname + '/../config/config'),
    mysql = require(__dirname + '/../lib/mysql'),
    logger = require(__dirname + '/../lib/logger'),
    curl = require(__dirname + '/../lib/curl'),
    as_helper = require(__dirname + '/../helpers/auth_server'),
    util = require(__dirname + '/../helpers/util'),
    googleapis = require('googleapis'),
    OAuth2 = googleapis.auth.OAuth2,
	oauth2_client = new OAuth2(config.google_auth.client_id, config.google_auth.client_secret, config.google_auth.callback_URL);

exports.register = function (req, res, next) {
    var data = req.body;
    data.app_id = config.app_id;
    data.roles = 'all,staff';

    logger.log('info', 'Someone is trying to register');
    res.clearCookie('data');

    curl.post
        .to(config.auth_server.host, config.auth_server.port, '/user/register')
        .send(data)
        .then(res.send.bind(res))
        .onerror(next);
};

exports.google_auth = function (req, res, next) {
    res.redirect(oauth2_client.generateAuthUrl({
        state : 'google',
        access_type: 'offline',
        approval_prompt : 'force',
        scope : [
            'profile',
            'email'
        ].join(' ')
    }));
};

exports.auth_google_callback = function (req, res, next) {
    var tokens,
        send_response = function (err, data) {
            if (err) return next(err);
            res.redirect(config.frontend_server_url + config.frontend_server_register_callback + '?access_token=' + (data.access_token || data));
        },
        done = function (err, user, info) {
            if (err) return next(err);

            switch (info) {
                case 0 :
                    as_helper.get_access_token({
                        user_id : user.user_data._id,
                        scope_token : user.scope_token,
                        scopes : 'user'
                    }, send_response);
                    break;
                case 1 :
                    curl.post
                        .to(config.auth_server.host, config.auth_server.port, '/user/register')
                        .send({                 // register
                            app_id : config.app_id,
                            scopes : 'self.view,self.edit,self.delete',
                            email : user.email || user.emails[0],
                            google_refresh_token : user.refresh_token,
                            fname : user.given_name || '',
                            lname : user.family_name || '',
                            avatar : user.picture
                        })
                        .then(function (status, data) {
                            if (status != 200)
                                send_response(data);
                            send_response(null, user);
                        })
                        .onerror(next);
            }
        },
        login_to_AS = function (err, response) {
            if (err) return next(err);
            response.access_token = response.access_token || tokens.access_token;
            response.refresh_token = response.refresh_token || tokens.refresh_token;
            as_helper.login(response, done);
        },
        get_client = function (err, client) {
            if (err) return next(err);
            client
                .oauth2.userinfo.get()
                .withAuthClient(oauth2_client)
                .execute(login_to_AS);
        },
        get_tokens = function(err, _tokens) {
            if (err) return next(err);
            tokens = _tokens;
            oauth2_client.setCredentials(_tokens);
            googleapis
                .discover('oauth2', 'v2')
                .execute(get_client);
        };

    // @override
    next = function (err) {
        console.dir(err);
        console.log(err.stack);
        res.cookie('error', err.message || JSON.stringify(err));
        res.redirect(config.frontend_server_url + '/error');
    };

    oauth2_client.getToken(req.query.code, get_tokens);
};

exports.login = function (req, res, next) {
    var data = util.get_data(['email', 'password'], [], req.body);

    if (typeof data === 'string')
        return next(data);

    data.source = 'self';
    data.app_id = config.app_id;

    curl.post
        .to(config.auth_server.host, config.auth_server.port, '/auth/login')
        .send(data)
        .then(res.send.bind(res))
        .onerror(next);
};

exports.get_user = function (req, res, next) {
    var send_response = function (err, data) {
            if (err) return next(err);
            res.send(data);
       };

    if (!req.access_token)
        return next('access_token is missing');

    as_helper.get_info({
        access_token : req.access_token,
        user_id : req.params.id,
        self : true
    }, send_response);
};


exports.update_user = function (req, res, next) {
    var data = req.body;
    data.access_token = req.access_token;

    logger.log('info', 'Someone is trying to update profile');

    if (!req.access_token)
        return next('access_token is missing');

    curl.put
        .to(config.auth_server.host, config.auth_server.port, '/user')
        .send(data)
        .then(res.send.bind(res))
        .onerror(next);
};

exports.logout = function (req, res, next) {
    logger.log('info', 'Someone is logging out');

	if (!req.access_token)
		return next('access_token is missing');

    as_helper.logout({
        access_token : req.access_token,
        app_id : config.app_id
    }, function () {
        res.clearCookie('access_token');
        res.send({message : 'Logout successful'});
    });
};


/*
exports.staff = function (req, res, next) {
    var roles = ['all', 'staff', 'channel', 'payout'],
		update_app_data = function () {
            as_helper.update_app_data({
                user_id : req.user_id,
                access_token : req.access_token,
                app_data : {roles : roles}
            }, res.send.bind(res), next);
        };

    logger.log('info', 'Someone wants to be a staff');

	if (!req.access_token)
		return next('access_token is missing');

    as_helper.add_self_scopes({
        access_token : req.access_token,
        user_id : req.user_id,
        scopes : roles.map(function (a) {
					return config.scopes[a];
				}).join(',')
    }, update_app_data, next);
};


exports.partner = function (req, res, next) {
    var roles = ['all', 'staff', 'channel', 'payout'],
		update_app_data = function () {
            as_helper.update_app_data({
                access_token : req.access_token,
                user_id : req.user_id,
                app_data : {roles : roles}
            }, res.send.bind(res), next);
        };

    logger.log('info', 'Someone wants to be a partner');

	if (!req.access_token)
		return next('access_token is missing');

    as_helper.add_self_scopes({
        access_token : req.access_token,
        user_id : req.user_id,
        scopes : roles.map(function (a) {
					return config.scopes[a];
				}).join(',')
    }, update_app_data, next);
};
*/