var moment = require('moment'),
	config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    curl = require(__dirname + '/../lib/curl'),

    validate_scopes = function (req, next, cb) {
		var call_auth_server = function (scopes) {
				as_helper.has_scopes(req.access_token, scopes, call_cb, next);
			},
			call_cb = function (status, data) {
				if (status !== 200) return next(data);
				cb(req.params.type);
			};
    	
    	if (!req.access_token)
    		return next('access_token is missing');

    	switch (req.params.type) {
			case 'recruiter' :
				call_auth_server('network.view');
				break;
			case 'partner' :
				call_auth_server('network.view');
				break;
			case 'channel' :
				call_auth_server('admin.view_all');
				break;
			case 'rev_share' :
				call_auth_server('admin.view_all,');
				break;
			default :
				return next('invalid type');
    	}
    };

exports.add_applicant = function (req, res, next) {
	validate_scopes(req, next, function (type) {
		switch (type) {
			case 'recruiter' :
				// user_id
				// network_id
				// status
				break;
			case 'partner' : 	//switch network
				// channel id
				// network id
				// status
				// *check if channel doesnt have network first
				break;
			case 'channel' :
				// channel lang
				// channel id
				// pdf file
				// status
				break;
			case 'rev_share' :
				// network lang
				// network id
				// yung mag apply
				// yung channel id
				// yung bagong share
				// status
				// *take into effect after 1 month after admin verification
				// *check if channel id within the network
				break;
		}
	});
};

exports.get_applicants = function (req, res, next) {
	switch (req.params.type) {
		case 'recruiter' :
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
			break;
		case 'partner' : 	//switch network
			break;
		case 'channel' :
			break;
		case 'rev_share' :
			break;
	}
};

exports.update_applicant = function (req, res, next) {

};

exports.download_applicant_proposal = function (req, res, next) {

};


