var config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    curl = require(__dirname + '/../lib/curl');

exports.get_networks = function (req, res, next) {
	var send_response = function (err, result) {
		if (err) return next(err);
		res.send(result);
	};

	if (!req.access_token)
		return next('access_token is missing');

	mysql.open(config.db_freedom)
		.query('SELECT _id, name FROM network', send_response)
		.end();
};

exports.get_channel_applicants = function (req, res, next) {
	var target = 'approver.network_' + req.user_id + '.status',
		view = function (err, _data) {

			if (err.data !== 'Success') return next(err);

			mongo.collection('partnership')
				.find(
					{
						target : false,
						type : 'channel'
					},
					{
						_id : 1,
						channel : 1
					},
					send_response);
		},
		send_response = function (err, result) {
			if (err) return next(err);

			return res.send(result);
		};

	as_helper.has_scopes(req.access_token, 'network.view', view, next);
};

exports.accept_channel_applicant = function (req, res, next) {
	var target = 'approver.network_' + req.user_id + '.status',
		update = function (err, data) {
			if (err) return next(err);

			mongo.collection('partnership')
				.update(
					{ channel: req.body.channel },
					{ $set : {
							target : true
						}
					},
					{},
					check_all_approver
				);
		},
		check_all_approver = function (err, result) {

			if (err) return next(err);

			mongo.collection('partnership')
				.findOne({ channel: req.body.channel }, function (err, result) {
					var i;

					if (err) return next(err);

					for (i in result.approver) {
						if (!result.approver[i].status)
							return res.send({message : 'network'});
					}

					mysql.open(config.db_freedom)
						.query('UPDATE channel SET partnership_status = 1, updated_at = ? where _id = ?',
								[+new Date, req.body.id],
								function (err, result) {
									if (err) return next(err);

									return res.send({message : 'all'});
						})
						.end();
				});
		};

	as_helper.has_scopes(req.access_token, 'network.accept', update, next);
};
