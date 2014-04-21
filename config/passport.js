var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	config = require('./config'),
    qs = require('querystring'),
    http = require('http');;

module.exports = function (passport) {
    passport.use(new GoogleStrategy({
        clientID        : config.googleAuth.clientID,
        clientSecret    : config.googleAuth.clientSecret,
        callbackURL     : config.googleAuth.callbackURL,
    },
    function(accessToken, refreshToken, profile, done) {
		process.nextTick(function() {
			var payload,
				req;
			
			payload = qs.stringify({
				email : profile.emails[0].value,
				app_id : config.app_id,
				source : 'google',
				google_access_token : accessToken
			});
						
			req = http.request({
                    host: config.auth_server.host,
                    port: config.auth_server.port,
                    path: '/auth/login',
                    method: 'POST',
                    headers : {
                        "Content-Type" : 'application/x-www-form-urlencoded',
                        "Content-Length" : payload.length
                    }
                }, function(response) {
					var s = '';
                    response.setEncoding('utf8');
                    response.on('data', function (chunk) {
						s += chunk;
                    });
                    response.on('end', function () {
						var data = JSON.parse(s);
						switch (response.statusCode) {
							case 200 : return done(null, data, 0);	// login successful
							case 404 : return done(null, {			// register
								email : profile.emails[0].value,
								google_refresh_token : refreshToken,
								fname : profile._json.given_name,
								lname : profile._json.family_name,
								avatar : profile._json.picture
							}, 1);
							default : return done(data.data);	// error
						}
                    });
                });
				
            req.on('error', function (err) {
				console.log('error connecting in auth server');
                return done(err);
            });
            req.write(payload);
            req.end();
	    });
    }));
};
