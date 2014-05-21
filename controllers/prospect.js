var config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    curl = require(__dirname + '/../lib/curl');

exports.add_prospect = function (req, res, next) {
	var data = util.get_data([
			'username',
			'owner',
			'thumbnail'
		], [], req.body),
		get_info = function () {
			as_helper.getInfo({
				access_token : req.signedCookies.access_token,
				self : true
			}, insert);
		},
		insert = function (err, result) {
			data.recruiter_id = result.user_data._id;
			data.recruiter_email = result.user_data.email;
			mysql.open(config.db_freedom)
				.query('INSERT into prospects SET ?', data, send_response)
				.end();
		},
		send_response = function (err, result) {
			if (err) return next(err);
			res.send({message : 'Prospect successfully added'});
		};

	if (typeof data === 'string')
		return next(data);

	if (!req.signedCookies.access_token)
		return next('access_token is missing');

	data.status = 'Lead';
	data.created_at = +new Date;

	as_helper.hasScopes(req.signedCookies.access_token, 'recruiter.all', get_info, next);
};

exports.get_prospects = function (req, res, next) {
	var get_prospects = function (err, res) {
			if (err) return next(err);
			mysql.open(config.db_freedom)
				.query('SELECT * FROM prospects WHERE recruiter_id = ?', res.user_data._id, send_response)
				.end();
		},
		send_response = function (err, result) {
			if (err) return next(err);
			res.send(result);
		};

	if (!req.signedCookies.access_token)
		return next('access_token is missing');

	as_helper.getInfo({
		access_token : req.signedCookies.access_token,
		self : true
	}, get_prospects);
};

