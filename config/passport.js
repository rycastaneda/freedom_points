var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	YoutubeStrategy = require('passport-youtube').Strategy,
	config = require('./config');

module.exports = function (passport) {

    passport.serializeUser(function(user, done) {
		console.log('serialize');
		console.dir(user);
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
		console.log('deserialize');
		console.log(id);
		done(null);
    });

    passport.use(new GoogleStrategy({
        clientID        : config.googleAuth.clientID,
        clientSecret    : config.googleAuth.clientSecret,
        callbackURL     : config.googleAuth.callbackURL,
    },
    function(accessToken, refreshToken, profile, done) {
		process.nextTick(function() {
			console.dir('google');
			console.dir(accessToken);
			console.dir(refreshToken);
			console.dir(profile);
			// newUser.google.id    = profile.id;
			// newUser.google.name  = profile.displayName;
			// newUser.google.email = profile.emails[0].value; // pull the first email
			return done(null);
	    });
    }));


	passport.use(new YoutubeStrategy({
        clientID        : config.googleAuth.clientID,
        clientSecret    : config.googleAuth.clientSecret,
        callbackURL     : config.googleAuth.callbackURL,
	},
	function(accessToken, refreshToken, profile, done) {
		process.nextTick(function() {
			console.dir('youtube');
			console.dir(accessToken);
			console.dir(refreshToken);
			console.dir(profile);
			return done(null);
	    });
	}));
};
