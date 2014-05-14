var config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    curl = require(__dirname + '/../lib/curl'),
	googleapis = require('googleapis'),
    OAuth2 = googleapis.auth.OAuth2;

oauth2Client = new OAuth2(config.googleAuth.clientID, config.googleAuth.clientSecret, config.googleAuth.callbackURL);;

exports.auth_channel = function (req, res, next) {
	res.redirect(oauth2Client.generateAuthUrl({
		state : 'channel',
		access_type: 'offline',
		approval_prompt : 'force',
		scope : [
			'https://www.googleapis.com/auth/youtube',
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/yt-analytics.readonly',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
			'https://www.googleapis.com/auth/youtubepartner',
			'https://www.googleapis.com/auth/youtube.readonly',
			'https://www.googleapis.com/auth/youtubepartner-channel-audit'
		].join(' ')
	}));
};


exports.auth_youtube_callback = function (req, res, next) {
	var tokens,
		redirect = function (err, response) {
			var data = {},
				i = response.items.length;
			if (err) return next(err);
			data.items = [];
			while (i--)
				data.items.push({
					_id : response.items[i].id,
					access_token : tokens.access_token,
					channel_name : response.items[i].brandingSettings.channel.title,
					total_views : response.items[i].statistics.viewCount,
					total_videos : response.items[i].statistics.videoCount,
					total_comments : response.items[i].statistics.commentCount,
					total_subscribers : response.items[i].statistics.subscriberCount,
					overall_goodstanding : response.items[i].auditDetails.overallGoodStanding,
					contentidclaims_goodstanding : response.items[i].auditDetails.contentIdClaimsGoodStanding,
					copyrightstrikes_goodstanding : response.items[i].auditDetails.copyrightStrikesGoodStanding,
					communityguidelines_goodstanding : response.items[i].auditDetails.communityGuidelinesGoodStanding
				});
			res.cookie('channels', JSON.stringify(data));
			res.redirect(config.frontend_server_url + '/channels/add');
		},
		getClient = function(err, client) {
			if (err) return next(err);
			client.youtube.channels.list({
					part : 'id, snippet, auditDetails, brandingSettings, contentDetails, invideoPromotion, statistics, status, topicDetails',
					mine : true
				})
				.execute(redirect);
		},
		getTokens = function(err, _tokens) {
			if (err) return next(err);
			tokens = _tokens;
			oauth2Client.setCredentials(_tokens);
			googleapis
				.discover('youtube', 'v3')
				.withAuthClient(oauth2Client)
				.execute(getClient);
		};

	// @override
	next = function (err) {
		res.cookie('error', err);
		res.redirect(config.frontend_server_url + '/error');
	};

	oauth2Client.getToken(req.query.code, getTokens);
};


exports.add_channel = function (req, res, next) {

	//curl ka ng self.edit at channels.add na scope for the user
	var data = util.get_data([
			'_id',
			'network_id',
			'channel_name',
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
		insert_mongo = function () {
			var partnership = {
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
			};
			mongo.collection('partnership')
				.insert(partnership, get_username)
		},
		get_username = function (err) {
			if (err) return next(err);
			curl.get
				.to('gdata.youtube.com', 80, '/feeds/api/users/' + data._id)
				.send({alt : 'json'})
				.then(insert_channel)
				.then(next)
		},
		insert_channel = function (status, json) {
			if (status === 200) {
				data.channel_username = json.entry['yt$username']['$t'];
				mysql.open(config.db_freedom)
					.query('INSERT into channel SET ?', data, insert_stat)
					.end();
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
				}, send_response)
				.end();
		},
		send_response = function (err, result) {
			if (err)
				return next(err);
			res.send({message : 'Channel was successfully added'});
		};

	if (typeof data === 'string')
		return next(data);

	data.last30_days = data.total_videos;
	data.created_at = +new Date;
	data.network_name = 'network name'; // should be from db

	//check scope here
	as_helper.hasScopes(req.signedCookies.access_token, 'channel.add', insert_mongo, next);
};


exports.get_channels = function (req, res, next) {

	//mag curl ka muna sa AS kung may scope na channels.view yung user, tapos dapat mavview nya yung mga owned at manage channels nya

	var send_response = function (err, result) {
		if (err) return next(err);
		res.send(result);
	};

	mysql.open(config.db_freedom)
		.query('SELECT * FROM channel', send_response)
		.end();
};


exports.search = function (req, res, next) {
	curl.get
		.to('www.googleapis.com', 443, '/youtube/v3/channels')
		.secured()
		.send({
			part : 'id, snippet, statistics',
			forUsername : req.query.id,
			maxResults : 1,
			fields : 'items(id, snippet/title, snippet/publishedAt, statistics/viewCount, statistics/subscriberCount)',
			key : config.google_api_key
		})
		.then(res.send.bind(res))
		.onerror(next);
};


// mga nilagay ni ninz

/*
//channel related operations, kelangan ng authentication from google para makapagperform ng edit
//nakalagay yung access token na gagamitin for each channel dun sa respective table rows nila
function editVideo(video_id, next ) {


};

function editPlaylist( playlist_id, next ) {


};

function editChannelInfo( channel_id, next ) {


};

exports.getChannelStats = function(req,res,next) {


};

exports.addChannelToUser = function(req,res,next) {


};

//will just return the stats of each channel associated with the logged in user
exports.leaderBoardPerUser = function(req,res,next) {
	var data = util.chk_rqd(['user_id'], req.body, next);


};
 */