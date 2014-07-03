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

	as_helper.has_scopes(req.access_token, 'recruiter.all', insert, next);
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

exports.update_prospect = function (req, res, next) {
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

	data.updated_at = +new Date;

	mysql.open(config.db_freedom)
		.query('UPDATE prospects SET ? WHERE recruiter_id = ? AND _id = ?', [data, req.user_id, req.body.id], send_response)
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



exports.search = function (req, res, next) {
	var data = {},
		get_first_video = function (status, _data) {
			if (status !== 200)
				return res.send(status, _data);
			data.search_result = _data;
			if (_data.items.length === 0)
				return send_response();
			data.search_result.items[0].scm = null;
			curl.get
				.to('www.googleapis.com', 443, '/youtube/v3/search')
				.secured()
				.send({
					part : 'snippet',
					type : 'video',
					sort : 'date',
					channelId : _data.items[0].id,
					maxResults : 1,
					fields : 'items(id/videoId)',
					key : config.google_api_key
				})
				.then(get_scm)
				.onerror(next);
		},
		get_scm = function (status, _data) {
			if (status !== 200)
				return res.send(status, _data);
			if (_data.items.length === 0)
				return check_db(200);
			curl.get
				.to('www.youtube.com', 443, '/watch')
				.raw()
				.secured()
				.send({v : _data.items[0].id.videoId})
				.then(check_db)
				.onerror(next);
		},
		check_db = function (status, raw) {
			var match;
			if (status !== 200)
				return res.send(status, raw);
			if (raw) {
				match = raw.match(/\<meta name=(\")?attribution(\")?(\s*)content=(.{1,50})\>/gi);
				if (match && match[0]) {
					match = match[0].substring(31);
					data.search_result.items[0].scm = match.substring(0, match.length - 2);
				}
			}
			mysql.open(config.db_freedom)
				.query('SELECT recruiter_id, recruiter_email, status, note, created_at FROM prospects WHERE username = ?', req.params.key, send_response)
				.end();
		},
		send_response = function (err, result) {
			data.self = false;
			data.is_recruited = result || [];
			if (err) return next(err);
			if (result && result.filter(function (a) {
								return a.recruiter_id === req.user_id;
							}).length > 0)
				data.self = true;
			res.send(data);
		};

	if (!req.access_token)
		return next('access_token is missing');

	curl.get
		.to('www.googleapis.com', 443, '/youtube/v3/channels')
		.secured()
		.send({
			part : 'id, snippet, statistics',
			forUsername : req.params.key,
			maxResults : 1,
			fields : 'items(id, snippet/title, snippet/publishedAt, snippet/thumbnails/default, statistics/viewCount, statistics/subscriberCount, statistics/videoCount)',
			key : config.google_api_key
		})
		.then(get_first_video)
		.onerror(next);
};