var util = require(__dirname + '/../helpers/util'),
    logger = require(__dirname + '/../lib/logger'),
    config = require(__dirname + '/../config/config'),
	passport = require('passport'),
    qs = require('querystring'),
    http = require('http');

// configure passport
require(__dirname + '/../config/passport')(passport);

exports.register = function (req, res, next) {
	var data = util.chk_rqd('email', 'lname', 'fname', 'birhtday', req.body, next),
		relayToAS = function () {
			var payload = qs.stringify(data),
                req = http.request({
                    host: config.systemone.host,
                    port: config.systemone.port,
                    path: config.systemone.path,
                    method: 'POST',
                    headers : {
                        "Content-Type" : 'application/x-www-form-urlencoded',
                        "Content-Length" : payload.length
                    }
                }, function(response) {
					var s = '';
                    response.setEncoding('utf8');
                    response.on('data', function (chunk) {
						s+=chunk;
                    });

                    response.on('end', function () {
                        saveInDb(JSON.parse(s));
                    });
                });
            req.on('error', function(err) {
                logger.log('info', 'student:login systemone not responding', JSON.stringify(err));
                return res.send(401, {message : 'Wrong username or password'});
            });
            req.write(payload);
            req.end();
			logger.log('verbose', 'student:login sending request to rodolfo');
        };
};

exports.auth_google = function () {
	return passport.authenticate('google', {
		scope : ['profile', 'email'],
		approvalPrompt : 'force',
		accessType : 'offline',
		state : 'google'
	});
};

exports.auth_youtube = function () {
	return passport.authenticate('youtube', {
		approvalPrompt : 'force',
		accessType : 'offline',
		scope : [
			'https://www.googleapis.com/auth/youtube',
			'email'
		],
		state : 'youtube'
	});
};

exports.auth_callback = function (req, res, next) {
	console.log('state', req.query.state);
	passport.authenticate(req.query.state, {
		successRedirect : '/profile',
		failureRedirect : '/'
	})(req, res, next);
};
