var config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    curl = require(__dirname + '/../lib/curl');

exports.add_prospect = function (req, res, next) {
	var data = util.get_data([
			'recruiter_id',
			'status',
			'access_token',
			'total_views',
			'total_comments',
			'total_subscribers',
			'total_videos',
			'overall_goodstanding',
			'communityguidelines_goodstanding',
			'copyrightstrikes_goodstanding',
			'contentidclaims_goodstanding'
		], [], req.body),
		get_username = function () {
			curl.get
				.to('gdata.youtube.com', 80, '/feeds/api/users/' + data._id)
				.send({alt : 'json'})
				.then(insert_channel)
				.then(next)
		},
		insert_channel = function (status, json) {
			console.log('g_insert');
			if (status === 200) {
				data.channel_username = json.entry['yt$username']['$t'];
				mysql.open(config.db_freedom)
					.query('INSERT into channel SET ?', data, insert_stat)
					.end();
			} else {
				next('Failed  to get username');
			}
		},
		insert_stat = function (err, result) {
			if (err && err.code === 'ER_DUP_ENTRY')
				return next('Channel already exist :(');
			if (err)
				return next(err);
			mysql.open(config.db_freedom)
				.query('INSERT into channel_stats SET ?', {
					channel_id : data._id,
					date : +new Date,
					views : data.total_views,
					subscribers : data.total_subscribers,
					videos : data.total_videos,
					comment : data.total_comments,
					overall_goodstanding : data.overall_goodstanding,
					communityguidelines_goodstanding : data.communityguidelines_goodstanding,
					copyrightstrikes_goodstanding : data.copyrightstrikes_goodstanding,
					contentidclaims_goodstanding : data.contentidclaims_goodstanding,
					created_at : +new Date
				}, insert_mongo)
				.end();
		},
		insert_mongo = function (err, result) {
			if (err) return next(err);
			mongo.collection('partnership')
				.insert({
					type : 'channel',
					channel : data._id,
					approver : {
						admin : {
							user_id : 1,	//dummy
							status : false,
							comments : ''
						},
						approver2 : {
							user_id : data.network_id,	//dummy
							status : false,
							comments : ''
						}
					},
					created_at : +new Date,
					updated_at : +new Date
				}, send_response);
		},
		send_response = function (err, result) {
			if (err) return next(err);
			res.send({message : 'Channel was successfully added'});
		};

	if (typeof data === 'string')
		return next(data);

	data.last30_days = data.total_videos;
	data.created_at = +new Date;
	data.network_name = 'network name'; // should be from db
	data.overall_goodstanding = data.overall_goodstanding === 'true' ? 1 : 0;
	data.communityguidelines_goodstanding = data.communityguidelines_goodstanding === 'true' ? 1 : 0;
	data.copyrightstrikes_goodstanding = data.copyrightstrikes_goodstanding === 'true' ? 1 : 0;
	data.contentidclaims_goodstanding = data.contentidclaims_goodstanding === 'true' ? 1 : 0;

	//check scope here
	as_helper.hasScopes(req.signedCookies.access_token, 'channel.add', get_username, next);
};

