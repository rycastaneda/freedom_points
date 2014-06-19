var config = require(__dirname + '/../config/config'),
    logger = require(__dirname + '/../lib/logger'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
	Channel_earnings = require(__dirname + '/../helpers/channel_earnings'),
    qs = require('querystring'),
    http = require('http'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin');

exports.get_channel_earnings = function (req, res, next) {
	var data = util.get_data(['report_id'], [], req.query),
		scopes = 'payout.view',
		report_ids = [],
		earnings,
		done = function (err, _data) {
			if (err) return next(err);
			res.send(_data);
		},
		get_earnings = function (err, _data) {
			if (err) return next(err);
			if(!_data.user_data[config.app_id+'_data'].channels_owned) return res.send({});
			req.query.report_id.split(',').forEach(function (ri) {
				if (ri.trim() !== '')
					report_ids.push(ri.trim());
			});
			earnings = new Channel_earnings (report_ids, _data.user_data[config.app_id + '_data'].channels_owned, done).get_earnings();
		},
		get_user_info = function (status, _data) {
			if (status !== 200) return next(_data);
			if (req.query.user_id)
				as_helper.get_info({access_token:req.access_token, user_id:req.query.user_id}, get_earnings);
			else
				as_helper.get_info({access_token:req.access_token, self:true}, get_earnings);
		};

	if (typeof data === 'string')
		return next(data);
	if (!req.access_token)
		return next('Missing access_token');

	req.query.user_id && (scopes = 'payout.view, admin.view_all');
	as_helper.has_scopes(req.access_token, scopes, get_user_info, next);

};

exports.net_networks_earnings = function (req, res, next) {

	var data = util.get_data(['report_id'], [], req.query),
		scopes = 'payout.view',
		report_ids = [],
		one_year = 31556926000,
		earnings,
		done = function (err, _data) {
			if (err) return next(err);
			res.send(_data);
		},
		get_earnings = function (err, _data) {
			if (err) return next(err);			
			if (_data.length === 0) 
				return res.send([]);
			req.query.report_id.split(',').forEach(function (ri) {
				if (ri.trim() !== '')
					report_ids.push(ri.trim());
			});
			earnings = new Channel_earnings (report_ids, _data.map( function (a) { return a._id }), done).get_earnings();
		},
		get_recruited_channels = function (err, _data) {
			if (err) return next(err);
			mysql.open(config.db_freedom)
				.query('SELECT _id, recruiter, recruited_date from channel where recruiter = ? and partnership_status and recruited_date is not null and recruited_date > ?', [_data.user_data._id, +new Date() - one_year ], get_earnings)
				.end();

		},
		get_user_info = function (err, _data) {

			if (req.query.user_id)
				as_helper.get_info({access_token:req.access_token, user_id:req.query.user_id}, get_recruited_channels);
			else
				as_helper.get_info({access_token:req.access_token, self:true}, get_recruited_channels);

		};

	if (typeof data === 'string')
		return next(data);
	if (!req.access_token)
		return next('Missing access_token');

	req.query.user_id && (scopes = 'payout.view, admin.view_all');
	as_helper.has_scopes(req.access_token, scopes, get_user_info, next);

};

exports.get_recruiter_earnings = function (req, res ,next) {

	var data = util.get_data(['report_id'], [], req.query),
		scopes = 'payout.view',
		report_ids = [],
		one_year = 31556926000,
		earnings,
		done = function (err, _data) {
			if (err) return next(err);
			res.send(_data);
		},
		get_earnings = function (err, _data) {
			if (err) return next(err);			
			if (_data.length === 0) 
				return res.send([]);
			req.query.report_id.split(',').forEach(function (ri) {
				if (ri.trim() !== '')
					report_ids.push(ri.trim());
			});
			earnings = new Channel_earnings (report_ids, _data.map( function (a) { return a._id }), done).get_earnings();
		},
		get_recruited_channels = function (err, _data) {
			if (err) return next(err);
			mysql.open(config.db_freedom)
				.query('SELECT _id, recruiter, recruited_date from channel where recruiter = ? and partnership_status and recruited_date is not null and recruited_date > ?', [_data.user_data._id, +new Date() - one_year ], get_earnings)
				.end();

		},
		get_user_info = function (err, _data) {

			if (req.query.user_id)
				as_helper.get_info({access_token:req.access_token, user_id:req.query.user_id}, get_recruited_channels);
			else
				as_helper.get_info({access_token:req.access_token, self:true}, get_recruited_channels);

		};

	if (typeof data === 'string')
		return next(data);
	if (!req.access_token)
		return next('Missing access_token');

	req.query.user_id && (scopes = 'payout.view, admin.view_all');
	as_helper.has_scopes(req.access_token, scopes, get_user_info, next);
};

exports.get_payment_schedule = function (req, res, next) {

};

exports.get_range_of_payments = function (req, res, next) {
	var data = {},
		done = function (err, data) {
			if (err)
				return next(err);
			res.send(data);
			return;
		},
		get_range = function (err, _data) {
			var dte;
			if (err)
				return next(err);
			mysql.open(config.db_earnings);
			if (!_data)
					mysql.query('SELECT id, start_date, end_date date from report group by id order by id desc;', done).end();
			else {
					dte = new Date(_data.user_data.created_at);
					mysql.query('SELECT id, start_date, end_date date from report where DATE_FORMAT(date(start_date),"%Y-%m") >= "' + dte.getFullYear() + '-' + ('0'+(dte.getMonth() + 1)).slice(-2) + '" group by id order by id desc', done).end();
			}
		};

	if (typeof data === 'string')
		return next(data);
	if (!req.access_token)
		return next('Missing access_token');


	if (req.query.all)
		get_range();
	else if (req.query.user_id)
		as_helper.get_info({access_token:req.access_token, user_id:req.query.user_id}, get_range);
	else
		as_helper.get_info({access_token:req.access_token, self:true}, get_range);

};


exports.generate_summed_payouts = function (req, res, next) {
	//TODO check if we have admin scopes, for admin module of earnings together with other earnings generation function
	var data = util.get_data(['report_id'], [], req.query),

		get_earnings = function (report_id) {
			console.log('Processing . . . . .');
			mysql.open(config.db_earnings)
				.query('delete from summed_earnings where report_id = ?',[report_id])
				.query('select sum(total_earnings) as total, channel, channel_display_name, user_channel_id, count(video_id) as video_count from revenue_vid where report_id = ? group by user_channel_id order by total asc;',[report_id],
			function (err, result) {
				if (err) return next(err);
				mysql.open(config.db_earnings);
				for(var i in result) {
					var rs = {
						report_id : report_id,
						user_channel_id : result[i].user_channel_id,
						earnings : result[i].total,
						channel : result[i].channel,
						channel_display_name : result[i].channel_display_name,
						video_count : result[i].video_count
					}
					mysql.query('INSERT into summed_earnings SET ?', rs, function (err, rs){
						if (err) {
							logger.log('error', err.message || err);
							return;
						}
						console.log(rs);
					});
				}
				res.send({message : "Finished processing summed earnings for report_id:" + report_id});
				mysql.end();
			}).end();
		};

	if (typeof data === 'string')
		return next(data);

	get_earnings(data.report_id);

};


//for new earnings
//run the checking for channel_id with NO channel value - own db lookup
//run the checking for channel value - own db
//run youtube check
//run final update query to get all the unfiltered results
// update revenue_vid set user_channel_id = CONCAT('UC',channel_id) where report_id ='1402092993' and channel_id != '' and user_channel_id is  null