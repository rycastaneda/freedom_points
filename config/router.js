var user = require(__dirname + '/../controllers/user');

module.exports = function (router, logger) {

	router.get('/user', user.info);
	router.put('/user', user.update);
	router.get('/logout', user.logout);
	router.post('/register', user.register);
	router.get('/auth/google', user.auth_google);
	router.get('/channel/add', user.auth_channel);
	router.get('/auth/callback', user.auth_callback);

	router.all('*', function (req, res) {
		res.send(404, {message : 'Nothing to do here.'});
	});

	router.use(function (err, req, res, next) {
		logger.log('error', err.message || err);
		return res.send(400, {message : err.message || err});
	});

	return router;
};
