var config = require(__dirname + '/../config/config'),
    logger = require(__dirname + '/../lib/logger'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    qs = require('querystring'),
    http = require('http'),
	mysql = require('mysql'),
	passport;

exports.setPassport = function (pp) {
	passport = pp;
};

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
	var data = util.chk_rqd(['user_id'], req.body, next);


};