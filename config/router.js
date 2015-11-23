var user = require(__dirname + '/../controllers/user'),
	admin = require(__dirname + '/../controllers/admin'),
	channel = require(__dirname + '/../controllers/channel'),
	network = require(__dirname + '/../controllers/network'),
	earnings = require(__dirname + '/../controllers/earnings'),
	prospect = require(__dirname + '/../controllers/prospect'),
	applicant = require(__dirname + '/../controllers/applicant');

module.exports = function (router, logger) {

	router.post('/register', user.register);
	router.get('/google_auth', user.google_auth);
	router.post('/login', user.login);
	router.get('/user/:id?', user.get_user);
	router.put('/user', user.update_user);
	router.get('/logout', user.logout);
	// router.get('/recruits', user.get_recruits);
	// router.get('/activities', user.activities);


	router.post('/prospect', prospect.add_prospect);
	router.get('/prospects', prospect.get_prospects);
	router.put('/prospect/:id', prospect.update_prospect);
	router.delete('/prospects', prospect.delete_prospects);
	router.get('/prospect/search/:key', prospect.search);


	router.post('/apply/:type', applicant.add_applicant);
	router.get('/applicants/:type', applicant.get_applicants);
	router.put('/applicant/:id', applicant.update_applicant);
	router.get('/applicant/:id/download', applicant.download_applicant_proposal);

	
	router.get('/channel/google_auth', channel.google_auth);
	router.post('/channel', channel.add_channel);
	router.get('/channels', channel.get_channels);
	router.get('/channel/:id', channel.get_channel);
	// router.put('/channel/partner/:id', channel.partner_channel);

	
	router.get('/networks', network.get_networks);
	//router.put('/network/:id', network.update_network);
	// router.get('/network/channels', network.get_channels);
	// router.delete('/network/channel/:id, network.delete_channel');
	// router.get('/network/recruiters', network.get_recruiters);
	// router.get('/network/recruiters/prospects', network.get_recruiters_prospects);


	// router.post('/sponsor/:id', sponsor.add_sponsor);
	// router.get('/sponsored_networks', sponsor.get_sponsored_network);
	// router.get('/sponsored_network/:id/revenue', sponsor.get_sponsored_network_revenue);


	router.get('/earnings/recruits', earnings.get_recruiter_earnings);
	router.get('/earnings/channels', earnings.get_channels_earnings);
	router.get('/earnings/network', earnings.get_networks_earnings);
	router.get('/earnings/date_range', earnings.get_range_of_payments);
	router.get('/earnings/generate_sum', earnings.generate_summed_payouts);
	

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
		if (typeof err === 'object') {
			if (err.message) {
				console.log('\nMessage: ' + err.message)
			}
			if (err.stack) {
				console.log('\nStacktrace:')
				console.log('====================')
				console.dir(err.stack);
			}
		}
		logger.log('error', err.message || err);
		return res.send(400, {message : err.message || err});
	});

	return router;
};

