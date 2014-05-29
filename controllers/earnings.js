var config = require(__dirname + '/../config/config'),
    logger = require(__dirname + '/../lib/logger'),
	util = require(__dirname + '/../helpers/util'),
    qs = require('querystring'),
    http = require('http'),
	mysql = require(__dirname + '/../lib/mysql');

//get each earnings from the database 'earnings_report'
//based from each feature from the dashboard, eto yung mga nasa overview tab
exports.getChannelEarnings = function(req,res,next) {
	var data = util.chk_rqd(['user_id','report_id'], req.body, next);


};

exports.getNetworkEarnings = function(req,res,next) {
	var data = util.chk_rqd(['user_id','report_id'], req.body, next);


};

exports.getRecruiterEarnings = function(req,res,next) {
	var data = util.chk_rqd(['user_id','report_id'], req.body, next);


};

exports.getPaymentSchedule = function(req,res,next) {
	var data = util.chk_rqd(['user_id','report_id'], req.body, next);


};

exports.getRangeOfPayments = function(req,res,next) {
	var data = util.get_data([
			'user_id',
			'access_token'
		], [], req.query)

		get_range = function(user_date) {

		};


	if(typeof data === 'string')
		return next(data);

	as_helper.get_info({self:true}, get_range);

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
				.query('select sum(total_earnings) as total, channel, user_channel_id from revenue_vid where report_id = ? group by user_channel_id order by total asc;',[report_id],
			function (err, result) {
				if (err) return next(err);
				mysql.open(config.db_earnings);
				for(var i in result) {
					var rs = {
						report_id : report_id,
						channel_id : result[i].user_channel_id,
						earnings : result[i].total
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