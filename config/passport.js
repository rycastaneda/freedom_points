var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    logger = require(__dirname + '/../lib/logger'),
    curl = require(__dirname + '/../lib/curl'),
	config = require(__dirname + '/config');

module.exports = function (passport) {
    passport.use(new GoogleStrategy({
        clientID        : config.googleAuth.clientID,
        clientSecret    : config.googleAuth.clientSecret,
        callbackURL     : config.googleAuth.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
		curl.post
			.to(config.auth_server.host, config.auth_server.port, '/auth/login')
			.send({
				email : profile.emails[0].value,
				app_id : config.app_id,
				source : 'google',
				google_access_token : accessToken
			})
			.then(function (status, data) {
				switch (status) {
					case 200 : return done(null, data, 0);			// login successful
					case 404 : return done(null, {					// register
						email : profile.emails[0].value,
						google_refresh_token : refreshToken,
						fname : profile._json.given_name,
						lname : profile._json.family_name,
						avatar : profile._json.picture
					}, 1);
				}

				return done(data);				// error
			})
			.then(function (err) {
				return done(err);
			});
    }));
};
