var user = require(__dirname + '/../controllers/user'),
	channel = require(__dirname + '/../controllers/channel'),
	prospect = require(__dirname + '/../controllers/prospect'),
	admin = require(__dirname + '/../controllers/admin'),
	earnings = require(__dirname + '/../controllers/earnings');

module.exports = function (router, logger) {

	//user related routes
	router.get('/user', user.info);
	router.put('/user', user.update);
	router.get('/logout', user.logout);
	router.post('/register', user.register);
	router.get('/auth/google', user.auth_google);

	// choose class
	router.post('/staff', user.staff);
	router.post('/partner', user.partner);

	// channel related routes
	router.get('/channel/search/:key', channel.search);
	router.get('/channels', channel.get_channels);
	router.get('/channel/add', channel.auth_channel);
	router.post('/channel/add', channel.add_channel);

	// admin
	router.get('/admin/partners', admin.find_applicants);
	router.post('/admin/partner/:id', admin.accept_applicant);
	router.post('/admin/identify', admin.verify_uid);


	//earnings related routes
	router.get('/earnings/date_range', earnings.getRangeOfPayments);
	router.get('/earnings/generate_sum', earnings.generateSummedPayouts);

	//prospect related routes
	router.get('/prospects', prospect.get_prospects);
	router.post('/prospect/add', prospect.add_prospect);
	router.put('/prospect/update', prospect.update_prospect);
	router.delete('/prospect/delete', prospect.delete_prospects);




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
		console.log('---error---');
		console.log(err);

		logger.log('error', err.message || err);
		return res.send(400, {message : err.message || err});
	});

	return router;
};
