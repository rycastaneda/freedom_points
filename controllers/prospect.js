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
		insert = function (err, result) {
			data.recruiter_id = req.user_id;
			data.recruiter_email = req.user.email;
			mysql.open(config.db_freedom)
				.query('INSERT into prospects SET ?', data, send_response)
				.end();
		},
		send_response = function (err, result) {
			if (err) return next(err);
			data._id = result.insertId;
			res.send({
				message : 'Prospect successfully added',
				prospect : data
			});
		};

	if (!req.access_token)
		return next('access_token is missing');
	if (typeof data === 'string')
		return next(data);

	data.status = 'Lead';
	data.created_at = +new Date;

	as_helper.hasScopes(req.access_token, 'recruiter.all', insert, next);
};

exports.get_prospects = function (req, res, next) {
	var send_response = function (err, result) {
			if (err) return next(err);
			res.send(result);
		};

	if (!req.access_token)
		return next('access_token is missing');

	mysql.open(config.db_freedom)
		.query('SELECT * FROM prospects WHERE recruiter_id = ?', req.user_id, send_response)
		.end();
};

exports.delete_prospects = function (req, res, next) {
	var send_response = function (err, result) {
			if (err) return next(err);
			res.send(result);
		};

	if (!req.access_token)
		return next('access_token is missing');
	if (!req.body.ids)
		return next('ids are missing');

	mysql.open(config.db_freedom)
		.query('DELETE FROM prospects WHERE recruiter_id = ? AND _id IN (?)', [req.user_id, req.body.ids.split(',')], send_response)
		.end();
};

exports.update_prospect = function (req, res, next) {
	console.dir(req.body);
	var data =  util.get_data([], ['status', 'note'], req.body),
		allowed_statuses = ['Lead', 'Contacted', 'Pitched', 'Demo', 'Negotiating', 'Closed (lost)' , 'Closed (won)'],
		send_response = function (err, result) {
			if (err) return next(err);
			res.send(result);
		};

	if (!req.access_token)
		return next('access_token is missing');
	if (data.status && !~allowed_statuses.indexOf(req.body.status))
		return next('Invalid status');
	if (!req.body.id)
		return next('Prospect id is missing');
	if (data.note === ' ')
		data.note = '';

	mysql.open(config.db_freedom)
		.query('UPDATE prospects SET ? WHERE recruiter_id = ? AND _id = ?', [data, req.user_id, req.body.id], send_response)
		.end();
};
