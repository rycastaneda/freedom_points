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
	var target,
		network_id,
		counter_data,

		// check if requester is a network
		check_if_network = function (status, _data) {
			if (typeof status === 'number' && status !== 200) return next(_data);

			// failsafe
			if (typeof status === 'object' && status.message !== 'Success') return next(status, _data);

			var query = 'SELECT _id from network where owner_id = ? LIMIT 1';

			mysql.open(config.db_freedom)
				.query(query, req.user_id, on_check_network)
				.end();
		},
		on_check_network = function (err, result) {
			if (err) return next(err);
			if (!result.length) return next('not a network');

			// assuming that the request contains an array of networks partnered to a network
			network_id = (!!~req.networks.indexOf(req.query.network_id)) ? req.query.network_id : result[0]._id;

			target = {};
			target["approver.network_" + network_id + ".status"] = false;

			// look for all channels that requested partnership to the network
			mongo.collection('partnership')
				.find(
					target,
					{
						_id : 0,
						channel : 1
					})
				.toArray(fetch_from_mysql);
		},
		fetch_from_mysql = function (err, result) {
			var query = 'SELECT * from channel where network_id = ? and _id IN (?) ORDER BY created_at',
				i,
				data = [network_id,[]];

			if (err) return next(err);
			if (!result.length) return next('no approved networks');

			for (i in result)
				data[1].push(result[i].channel);

			mysql.open(config.db_freedom)
				.query(query, data, send_response)
				.end();
		},
		send_response = function (err, result) {
			if (err) return next(err);

			if (!result.length) return res.send({message : 'no channels to approve'})

			return res.send(result);
		};


	as_helper.has_scopes(req.access_token, 'network.view', check_if_network, next);
};

exports.accept_channel_applicant = function (req, res, next) {
	var target,
		network_id,
		check_if_network = function (status, _data) {
			var query = 'SELECT _id from network where owner_id = ? LIMIT 1';

			mysql.open(config.db_freedom)
				.query(query, req.user_id, update)
				.end();
		},
		update = function (err, result) {
			if (err) return next(err);

			if (!result.length || !result[0]._id) return next('not a network');

			network_id = result[0]._id;

			target = {};
			target["approver.network_" + network_id + ".status"] = true;

			mongo.collection('partnership')
				.update(
					{ channel: req.body.channel },
					{ $set : target },
					{},
					check_all_approver
				);
		},
		check_all_approver = function (err, result) {
			if (err) return next(err);

			if (!result) return next('no such channel');

			mongo.collection('partnership')
				.findOne({ channel: req.body.channel }, update_channel);
		},
		update_channel = function (err, result) {
			var i,
				query = 'UPDATE channel SET partnership_status = 1, updated_at = ? where _id = ? LIMIT 1',
				data = [+new Date, req.body.channel];

			if (err) return next(err);

			for (i in result.approver) {
				if (!result.approver[i].status)
					return res.send({message : 'network'});
			}

			mysql.open(config.db_freedom)
				.query(query, data, response)
				.end();

		},
		response = function (err, result) {
			if (err) return next(err);

			return res.send({message : 'all'});
		};


	as_helper.has_scopes(req.access_token, 'network.accept', check_if_network, next);
};
