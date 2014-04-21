var config = require(__dirname + '/../config/config'),
    logger = require(__dirname + '/../lib/logger'),
	util = require(__dirname + '/../helpers/util'),
    qs = require('querystring'),
    http = require('http'),
	passport;

exports.setPassport = function (pp) {
	passport = pp;
};

exports.register = function (req, res, next) {
	var data = util.chk_rqd(['email', 'lname', 'fname', 'birthdate'], req.body, next),
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
						console.dir(data);
						switch (response.statusCode) {
							case 200 : return res.redirect(config.frontend_server_url + '/login.html');
							default : return res.redirect(config.frontend_server_url + '/failure.html#' + data.data);
						}
                    });
                });
            req.on('error', function (err) {	
                console.log('Unable to connect to auth server');
				console.dir(err);
				return res.redirect(config.frontend_server_url + '/failure.html#' + err);
            });
            req.write(payload);
            req.end();
        };
		
	data.birthdate = +new Date(data.birthdate);
	data.app_id = config.app_id;
	
	if (req.body.google_refresh_token) {
		data.google_refresh_token = req.body.google_refresh_token;
		data.password = ' ';
	}
	else if (!req.body.password) {
		return next(new Error('password is missing'));
	}
	if (req.body.postal_code && !isNaN(req.body.postal_code)) {
		data.postal_code = req.body.postal_code;
	}
	
	req.body.street_address && (data.street_address = req.body.street_address);
	req.body.referrer && (data.referrer = req.body.referrer);
	req.body.country && (data.country = req.body.country);
	req.body.avatar && (data.avatar = req.body.avatar);
	req.body.skype && (data.skype = req.body.skype);
	req.body.state && (data.state = req.body.state);
	req.body.city && (data.city = req.body.city);

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
		switch (info) {
			case 0 : return res.redirect(config.frontend_server_url + '/login.html');
			case 1 : return res.redirect(config.frontend_server_url + '/birthday.html#' + encodeURIComponent(JSON.stringify(user)));
			default : return res.redirect(config.frontend_server_url + '/failure.html#' + err);
		}
	})(req, res, next);
};
