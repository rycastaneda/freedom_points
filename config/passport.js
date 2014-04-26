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

				return done(data.data);				// error
			})
			.then(function (err) {
				// remove this after
				return done(null, {"user_data":{"profile_info":{"custom_url":"","avatar":"https://lh4.googleusercontent.com/-8yUvwB-z09E/AAAAAAAAAAI/AAAAAAAAAGQ/jW5Hhr6gQ7A/photo.jpg","paypal":"","fname":"Raven John","lname":"Lagrimas"},"contact_info":{"phone":[],"twitter":"","facebook":"","address":{}},"freedom_data":{"user_scope":["web.view","mobile.view","self.view","self.edit","self.delete"]},"email":"rjlagrimas08@gmail.com","_id":"8df0532f06b276dbac7b44bad30ac90b","is_system_admin":false,"email_confirmed":false},"scope_token":"a5986070d58ba777f4897a045c56bb71","memory_usage":"{ rss: 41787392, heapTotal: 33179136, heapUsed: 15874656 }","response_time":90,"method":"POST","action":"login","object":"auth"}, 0);

				return done(err);
			});

		logger.log('info', 'Sending login request to auth server');
    }));
};
