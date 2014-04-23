var logger = require(__dirname + '/../lib/logger'),
	user = require(__dirname + '/../controllers/user');

module.exports = function (app, passport) {
	user.setPassport(passport);

    app.get('/user', user.info);
    app.post('/register', user.register);
    app.get('/auth/google', user.auth_google());
    app.get('/auth/google/callback', user.auth_google_callback);

    app.get('*', function (req, res) {
        res.redirect('/index.html');
    });

    // error handling
    app.use(function (err, req, res, next) {
        logger.log('warn', err.message);
        return res.send(err.code || 400, {message : err.message});
    });

	logger.log('verbose', 'done setting up router');
};
