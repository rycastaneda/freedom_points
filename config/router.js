var user = require(__dirname + '/../controllers/user'),
	channel = require(__dirname + '/../controllers/channel');
	earnings = require(__dirname + '/../controllers/earnings');

module.exports = function (router, logger) {

	router.get('/user', user.info);
	router.put('/user', user.update);
	router.get('/logout', user.logout);
	router.post('/register', user.register);
	router.get('/auth/google', user.auth_google);
	router.post('/staff', user.staff);
	router.post('/partner', user.partner);

	router.get('/channels', channel.get_channels);
	router.get('/channel/add', channel.auth_channel);
	router.post('/channel/add', channel.add_channel);
	


	router.get('/earnings/generate_sum', earnings.generateSummedPayouts);

	router.get('/auth/callback', function (req, res, next) {
		if (req.query.state === 'google')
			user.auth_google_callback(req, res, next);
		else
			channel.auth_youtube_callback(req, res, next);
	});

	router.all('*', function (req, res) {
		res.send(404, {message : 'Nothing to do here.'});
	});

	router.use(function (err, req, res, next) {
		logger.log('error', err.message || err);
		return res.send(400, {message : err.message || err});
	});

	return router;
};
