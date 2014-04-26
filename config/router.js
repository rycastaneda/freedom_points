var user = require(__dirname + '/../controllers/user');

module.exports = function (router, logger, passport) {
	user.setPassport(passport);

    router.get('/user', user.info);
    router.put('/user', user.update);
    router.get('/logout', user.logout);
    router.post('/register', user.register);
    router.get('/auth/google', user.auth_google());
    router.get('/auth/google/callback', user.auth_google_callback);

    router.all('*', function (req, res) {
        res.send(404, {
			message : 'Nothing to do here.'
		});
    });

    router.use(function (err, req, res, next) {
        logger.log('warn', err.message);
        return res.send(err.code || 400, {message : err.message});
    });

	return router;
};
