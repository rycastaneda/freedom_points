var fs = require('fs'),
	config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    curl = require(__dirname + '/../lib/curl');

exports.apply = function (req, res, next) {

	var send_response = function (status, data) {

		if (status !== 200)
			return next(data);

		res.send({});
	};

	if (!req.access_token)
		return next('access_token is missing');

	req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
		var temp = filename.split('.');
		
		if (temp[temp.length - 1] !== 'pdf') {
			return next('Invalid file type');
		}

		file.pipe(fs.createWriteStream(config.upload_dir + 'network_applications/' + req.user_id + '.' + temp[temp.length - 1]));
	});

	req.busboy.on('finish', function () {
		req.user_data.network_application = {};
		req.user_data.network_application.status = 'Pending';
		req.user_data.network_application.submitted_at  = +new Date;
		// req.user_data.network_application.has_pending_network_application = true;
		as_helper.update_app_data({
			access_token : req.access_token,
			user_id : req.user_id,
			app_data : req.user_data
		}, send_response, next);
	});

	req.pipe(req.busboy);
};

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
			var query = 'SELECT _id from network where owner_id = ? LIMIT 1';

			if (typeof status === 'number' && status !== 200) return next(_data);

			// failsafe
			if (typeof status === 'object' && status.message !== 'Success') return next(status, _data);


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

exports.view_rev_share = function (req, res, next) {
	var check_if_network = function (status, _data) {
			var query = 'SELECT * FROM network WHERE owner_id = ?';

			if (typeof status === 'number' && status != 200) return next(status);

			// failsafe when auth server returned stupid result
			if (typeof status === 'object' && status.message !== 'Success') return (status, _data);

			mysql.open(config.db_freedom)
				.query(query, req.user_id, on_check_network);
		},
		on_check_network = function (_err, _data){
			var network,
				target_network;

			if (_err) return next(_err);

			if (_data.length !== 1) return next(_err);

			// assuming that the req body contains an array of networks in `req.networks`
			network = (req.networks && !!~req.networks.indexOf(req.query.network_id)) ? req.query.network_id : _data[0]._id;

			target_network = {};
			target_network['approver.network_' + network.toString() + '.status'] = false;

			mongo.collection('revenue_share')
				.find(target_network)
				.toArray(send_response);

		},
		get_all = function (status, _data) {
			if (typeof status === 'number' && status != 200) return next(status);

			// failsafe when auth server returned stupid result
			if (typeof status === 'object' && status.message !== 'Success') return (status, _data);

			mongo.collection('revenue_share')
				.find({'approver.admin.status' : false}, send_response);

		},
		send_response = function (err, result) {
			if (err) return next(err);

			if (result.length < 1) return next('nothing to approve');

			return res.send(result);
		};



	if (req.query.admin === 1 && req.is_admin)
		as_helper.has_scopes(req.access_token, 'admin.edit_all', get_all, next);
	else
		as_helper.has_scopes(req.access_token, 'network.get_share', check_if_network, next);
};

exports.approve_rev_share = function (req, res, next) {
	var current_network;
		check_if_network = function (status, _data) {
			var query = 'SELECT * FROM network where owner_id = ?;';

			if (typeof status === 'number' && status != 200) return next(status);

			// failsafe for stupid auth server returns
			if (typeof status === 'object' && status.message !== 'Success') return (status, _data);

			if (!req.body.channel) return next("missing channel");
			if (isNaN(req.body.share)) return next("missing share");

			mysql.open(config.db_freedom)
				.query(query, req.user_id, on_check_network)
				.end();
		},
		on_check_network = function (_err, _result) {
			var network,
				query = 'SELECT _id from channel where network_id = ?';

			if (_err || !_result || _result.length !== 1) return next(_err);

			current_network = _result[0]._id;

			mysql.open(config.db_freedom)
				.query(query, current_network, all_networks_owned)
				.end();
		},
		all_networks_owned = function (_err, _result) {
			var data = {},
				networks_owned = [],
				i;

			if (_err) return next(_err);

			if (_result.length < 1) return next('no channels owned');

			for (i in _result)
				networks_owned.push(_result[i]._id);

			if (!~networks_owned.indexOf(req.body.channel)) return next ('you don\'t own that channel');

			data.approved = false;
			data.approver = {};
			data.approver['admin'] = {
								comments : "",
								status : false,
								user_id : null
							};

			data.approver['network_' + current_network.toString()] = {
								comments : "",
								status : true,
								user_id : req.user_id
							};

			data.entity_id = req.body.channel;
			data.revenue_share = req.body.share;
			data.created_at = +new Date;
			data.updated_at = null;
			data.date_effective = null;
			data.latest = null;

			mongo.collection('test')
				.insert(data,on_insert_new_share);

		},
		on_insert_new_share = function (_err, _result) {
			if (_err) return next(_err);
			if (_result < 1) return next('nothing changed');

			return res.send({message : 'done'});

		},
		approve_admin = function (status, _data) {
			if (typeof status === 'number' && status !== 200) return next(_data);

			// failsafe for stupid auth server returns
			if (typeof status === 'object' && status.message !== 'Success') return next(status, _data);

			mongo.collection('revenue_share')
				.find({_id : util.toObjectId(req.body.id)})
				.toArray(update_all);
		},
		update_all = function (_err, _result) {
			var i,
				all_true = true,
				updates = {};


			for (i in _result[0].approver){
				if (!_result[0].approver[i].status && i !== 'admin')
					all_true = false;
			}

			if (all_true) updates.approved = true;
			updates['approver.admin.status'] = true;

			mongo.collection('revenue_share')
				.update({_id : util.toObjectId(req.body.id)},
					{'$set' : updates},
					send_response);
		},
		send_response = function (_err, _result) {
			if (_err) return next(_err);
			if (_result !== 1) return next ({message : "no update or too many updates"});


			return res.send({message : "updated"});
		};

	if (parseInt(req.body.admin) === 1 && req.is_admin)
		as_helper.has_scopes(req.access_token, 'admin.edit_all', approve_admin,next);
	else
		as_helper.has_scopes(req.access_token, 'network.approve_share', check_if_network, next);
};

exports.get_network_applicants = function (req, res, next) {
	var get_users = function (status, data) {
			if (status !== 200) return next(data);
			as_helper.get_users(req.access_token, {'app.network_application.status' : 'Pending'}, send_response, next);
		},
		send_response = function (status, data) {
			if (status !== 200) return next(data);
			res.send(data);
		};

	if (!req.access_token)
		return next('access_token is missing');

	as_helper.has_scopes(req.access_token, 'admin.view_all', get_users, next);
};

exports.download_proposal = function (req, res, next) {
	var get_users = function (status, data) {
			if (status !== 200) return next(data);
			res.download(config.upload_dir + 'network_applications/' + req.params.id + '.pdf');
		};

	if (!req.access_token)
		return next('access_token is missing');

	as_helper.has_scopes(req.access_token, 'admin.view_all', get_users, next);
};

exports.update_proposal = function (req, res, next) {
	var allowed = ['Accepted', 'Rejected'],
		get_user = function (status, data) {
			if (status !== 200) return next(data);
			as_helper.get_info({
				access_token : req.access_token,
				user_id : req.params.id,
				self : false
			}, update_user);
		},
		update_user = function (err, data) {
			if (err) return next(err);
			logger.log('info', 'User found')
			console.dir(data);
			data.app_data.network_application.status = req.body.status;
			as_helper.update_app_data({
				user_id : req.params.id,
				access_token : req.access_token,
				app_data : data.app_data
			}, send_response, next);
		},
		send_response = function (status, data) {
			if (status !== 200) return next(data);
			res.send('Proposal successfully updated');
		};

	if (!req.access_token)
		return next('access_token is missing');

	if (!req.params.id)
		return next('id is missing');

	if (!req.body.status)
		return next('status is missing');

	if (!~allowed.indexOf(req.body.status))
		return next('invalid status');

	as_helper.has_scopes(req.access_token, 'admin.edit_all', get_user, next);
};

