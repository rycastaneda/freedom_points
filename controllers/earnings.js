var config = require(__dirname + '/../config/config'),
    logger = require(__dirname + '/../lib/logger'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    qs = require('querystring'),
    http = require('http'),
	mysql = require(__dirname + '/../lib/mysql');

//get each earnings from the database 'earnings_report'
//based from each feature from the dashboard, eto yung mga nasa overview tab
exports.get_channel_earnings = function(req,res,next) {
	var data = util.get_data([
			'report_id'
		], [], req.query),
		scopes = 'payout.view',
		get_userinfo = function(status, _data) {
			if (status !== 200)
				return next(_data);

			
		};






	if(typeof data === 'string')
		return next(data);

	req.query.user_id && scopes = ('payout.view, admin.view_all');
	as_helper.has_scopes(req.access_token, scopes, get_userinfo, next);

};

exports.net_networks_earnings = function(req,res,next) {
	var data = util.chk_rqd(['user_id','report_id'], req.body, next);


};

exports.get_recruiter_earnings = function(req,res,next) {
	var data = util.chk_rqd(['user_id','report_id'], req.body, next);


};

exports.get_payment_schedule = function(req,res,next) {
	var data = util.get_data([
			'access_token'
		], [], req.query);


};

exports.get_range_of_payments = function(req,res,next) {
	var data = util.get_data([
			'access_token'
		], [], req.query),
		done = function(err,data) {
			if (err)
				return next(err);
			res.send(data);
			return;
		},
		get_range = function(err,dt) {
			var dte;
			if (err)
				return next(err);
			mysql.open(config.db_earnings);
			if (!dt)
					mysql.query('SELECT id, start_date, end_date date from report group by id order by id desc;',done).end();
			else {
					dte = new Date(dt.user_data.created_at);
					console.log(dte);
					mysql.query('SELECT id, start_date, end_date date from report where DATE_FORMAT(date(start_date),"%Y-%m") >= "'+dte.getFullYear()+'-'+('0'+(dte.getMonth()+1)).slice(-2)+'" group by id order by id desc;',done).end();
			}
		};
	if (typeof data === 'string')
		return next(data);
	if (req.query.all)
		get_range();
	else if (req.query.user_id)
		as_helper.get_info({access_token:req.query.access_token, user_id:req.query.user_id}, get_range);
	else 
		as_helper.get_info({access_token:req.query.access_token, self:true}, get_range);

};


exports.generateSummedPayouts = function(req,res,next) {
	//check if we have admin scopes
	var data = util.get_data([
			'report_id',
			'access_token'
		], [], req.query),

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
					mysql.query('INSERT into summed_earnings SET ?',rs, function(err,rs){
						if(err) {
							logger.log('error', err.message || err);
							return;
						}
						console.log(rs);
					});
				}
				res.send({message:"Finished processing summed earnings for report_id:" + report_id});
				mysql.end();
			}).end();
		};

	if(typeof data === 'string')
		return next(data);

	get_earnings(data.report_id);

};