var moment = require('moment'),
	config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    curl = require(__dirname + '/../lib/curl'),
	googleapis = require('googleapis'),
    OAuth2 = googleapis.auth.OAuth2,
	oauth2_client = new OAuth2(config.google_auth.client_id, config.google_auth.client_secret, config.google_auth.callback_URL);


exports.auth_channel = function (req, res, next) {

	if (!req.access_token)
		return next('access_token is missing');

	res.redirect(oauth2_client.generateAuthUrl({
		state : 'channel',
		access_type: 'offline',
		scope : [
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/youtube',
			'https://www.googleapis.com/auth/youtube.readonly',
			'https://www.googleapis.com/auth/youtubepartner',
			'https://www.googleapis.com/auth/youtubepartner-channel-audit',
			'https://www.googleapis.com/auth/yt-analytics.readonly',
			'https://www.googleapis.com/auth/yt-analytics-monetary.readonly'
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
					refresh_token : tokens.refresh_token,
					published_at : +new Date(response.items[i].snippet.publishedAt),
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
		get_client = function(err, client) {
			if (err) return next(err);
			client.youtube.channels.list({
					part : 'id, snippet, auditDetails, brandingSettings, contentDetails, invideoPromotion, statistics, status, topicDetails',
					mine : true
				})
				.execute(redirect);
		},
		get_tokens = function(err, _tokens) {
			if (err) return next(err);
			tokens = _tokens;
			oauth2_client.setCredentials(_tokens);
			googleapis
				.discover('youtube', 'v3')
				.withAuthClient(oauth2_client)
				.execute(get_client);
		};

	// @override
	next = function (err) {
		res.cookie('error', err);
		res.redirect(config.frontend_server_url + '/error');
	};

	if (!req.access_token)
		return next('access_token is missing');

	oauth2_client.getToken(req.query.code, get_tokens);
};


exports.add_channel = function (req, res, next) {
	var data = util.get_data([
			'_id',
			'channel_name',
			'access_token',
			'refresh_token',
			'published_at',
			'total_views',
			'total_comments',
			'total_subscribers',
			'total_videos',
			'overall_goodstanding',
			'communityguidelines_goodstanding',
			'copyrightstrikes_goodstanding',
			'contentidclaims_goodstanding'
		], ['network_id'], req.body),
		get_username = function (status, _data) {
			if (status !== 200)
				return next(_data);
			data.user_id = req.user_id;
			curl.get
				.to('www.googleapis.com', 443, '/youtube/v3/search')
				.secured()
				.send({
					part : 'snippet',
					channelId : data._id,
					type : 'video',
					maxResults : 1,
					fields : 'items(snippet/channelTitle)',
					key : config.google_api_key
				})
				.then(insert_channel)
				.then(next);
		},
		insert_channel = function (status, json) {
			if (status === 200) {
				data.channel_username = json.items[0]
					? json.items[0].snippet.channelTitle
					: data._id.substring(2);

				// if network_id exists, go get the network_name the insert to database

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
				}, insert_partnership)
				.end();
		},
		insert_partnership = function (err, result) {
			var datum = {
					type : 'channel',
					channel : data._id,
					approver : {
						admin : {
							user_id : null,	//dummy
							status : false,
							comments : ''
						}
					},
					created_at : +new Date,
					updated_at : +new Date
				};
			if (err) return next(err);
			if (data.network_id) {
				datum.approver.approver2 = {
					user_id : data.network_id,	//dummy
					status : false,
					comments : ''
				};
			}
			mongo.collection('partnership')
				.insert(datum, insert_revshare);
		},
		insert_revshare = function(err,result) {
			var datum = {
					entity_id : data._id,
					approver : {
						admin : {
							user_id : null,	//dummy
							status : true,		//for first time only, then set to false as default
							comments : ''
						}
					},
					revenue_share : 60,			//default
					latest : true,
					date_effective : +new Date,
					created_at : +new Date,
					updated_at : +new Date
				};
			if (err) return next(err);
			if (data.network_id) {
				datum.approver.approver2 = {
					user_id : data.network_id,	//dummy
					status : false,
					comments : ''
				};
			}
			mongo.collection('revenue_share')
				.insert(datum, update_app_data);
		},
		update_app_data = function (err) {
			if (err) return next(err);
			if (!req.user_data.channels_owned) {
				req.user_data.channels_owned = [data._id];
			}
			else {
				req.user_data.channels_owned.push(data._id);
			}
			as_helper.update_app_data({
				access_token : req.access_token,
				user_id : req.user_id,
				app_data : req.user_data
			}, send_response, next);
		},
		send_response = function (status, data) {
			if (status !== 200)
				return next(data);
			res.clearCookie('channels');
			res.send({message : 'Channel was successfully added'});
		};

	if (!req.access_token)
		return next('access_token is missing');
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
	as_helper.has_scopes(req.access_token, 'channel.add', get_username, next);
};


exports.get_channels = function (req, res, next) {
	var get_from_db = function (status, _data) {
			if (status !== 200)
				return next(_data);
			mysql.open(config.db_freedom)
				.query('SELECT * FROM channel WHERE user_id = ?', req.user_id, send_response)
				.end();
		},
		send_response = function (err, result) {
			if (err) return next(err);
			res.send(result);
		};

	if (!req.access_token)
		return next('access_token is missing');

	as_helper.has_scopes(req.access_token, 'channel.view', get_from_db, next);
};


exports.search = function (req, res, next) {
	var data = {},
		get_first_video = function (status, _data) {
			if (status !== 200)
				return res.send(status, _data);
			data.search_result = _data;
			if (_data.items.length === 0)
				return send_response();
			data.search_result.items[0].scm = null;
			curl.get
				.to('www.googleapis.com', 443, '/youtube/v3/search')
				.secured()
				.send({
					part : 'snippet',
					type : 'video',
					sort : 'date',
					channelId : _data.items[0].id,
					maxResults : 1,
					fields : 'items(id/videoId)',
					key : config.google_api_key
				})
				.then(get_scm)
				.onerror(next);
		},
		get_scm = function (status, _data) {
			if (status !== 200)
				return res.send(status, _data);
			if (_data.items.length === 0)
				return check_db(200);
			curl.get
				.to('www.youtube.com', 443, '/watch')
				.raw()
				.secured()
				.send({v : _data.items[0].id.videoId})
				.then(check_db)
				.onerror(next);
		},
		check_db = function (status, raw) {
			var match;
			if (status !== 200)
				return res.send(status, raw);
			if (raw) {
				match = raw.match(/\<meta name=(\")?attribution(\")?(\s*)content=(.{1,50})\>/gi);
				if (match && match[0]) {
					match = match[0].substring(31);
					data.search_result.items[0].scm = match.substring(0, match.length - 2);
				}
			}
			mysql.open(config.db_freedom)
				.query('SELECT recruiter_id, recruiter_email, status, note, created_at FROM prospects WHERE username = ?', req.query.key || req.params.key, send_response)
				.end();
		},
		send_response = function (err, result) {
			data.self = false;
			data.is_recruited = result || [];
			if (err) return next(err);
			if (result && result.filter(function (a) {
								return a.recruiter_id === req.user_id;
							}).length > 0)
				data.self = true;
			res.send(data);
		};

	if (!req.access_token)
		return next('access_token is missing');

	curl.get
		.to('www.googleapis.com', 443, '/youtube/v3/channels')
		.secured()
		.send({
			part : 'id, snippet, statistics',
			forUsername : req.query.key || req.params.key,
			maxResults : 1,
			fields : 'items(id, snippet/title, snippet/publishedAt, snippet/thumbnails/default, statistics/viewCount, statistics/subscriberCount, statistics/videoCount)',
			key : config.google_api_key
		})
		.then(get_first_video)
		.onerror(next);
};

exports.get_analytics = function (req, res, next) {
	var data = {},
		bearer,
		published_at,
		done = false,
		continents = {
			africa : '002',
			america : '019',
			asia : '142',
			europe : '150',
			oceania : '009'
		},
		total_requests = 8,
		continent_count = 5,
		format_data = function (_data) {
			var i,
				j;
			_data.columnHeaders = _data.columnHeaders.map(function (a) {
				return a.name;
			});
			_data.data = {};
			for (i in _data.columnHeaders) {
				_data.rows = _data.rows || [];
				j = _data.rows.length;
				while (j--) {
					if (_data.data[_data.columnHeaders[i]])
						_data.data[_data.columnHeaders[i]].push(_data.rows[j][i]);
					else
						_data.data[_data.columnHeaders[i]] = [_data.rows[j][i]];
				}
			}
			delete _data.rows;
			return _data;
		},
		get_published_at = function () {
			mysql.open(config.db_freedom)
				.query('SELECT published_at, refresh_token FROM channel WHERE user_id = ? AND _id = ?', [req.user_id, req.params.id], get_access_token)
				.end();
		},
		get_access_token = function (err, result) {
			if (err)
				return next(err);
			if (result.length === 0)
				return next('Unknown channel');
			published_at = moment(result[0].published_at).format('YYYY-MM-DD');
			curl.post
				.to('accounts.google.com', 443, '/o/oauth2/token')
				.secured()
				.send({
					client_id : config.google_auth.client_id,
					client_secret : config.google_auth.client_secret,
					refresh_token : result[0].refresh_token,
					grant_type : 'refresh_token'
				})
				.then(buster_call)
				.onerror(next);
		}
		buster_call = function (status, _data) {
			if (!done && status !== 200)
				return res.send(status, _data);
			bearer = 'Bearer ' + _data.access_token;
			get_lifetime();
			get_last_30_days();
			get_per_source();
			get_per_continent();
		},
		get_lifetime = function () {
			curl.get
				.to('www.googleapis.com', 443, '/youtube/analytics/v1/reports')
				.add_header('Authorization', bearer)
				.secured()
				.send({
					ids : 'channel==' + req.params.id,
					'start-date' : published_at,
					'end-date' : moment().format('YYYY-MM-DD'),
					fields : 'columnHeaders/name,rows',
					metrics : 'views,likes,dislikes,shares,comments,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,annotationClickThroughRate,annotationCloseRate,subscribersGained,subscribersLost'
				})
				.then(function (status, _data) {
					data.lifetime = format_data(_data);
					send_response(status, _data);
				})
				.onerror(function (err) {
					!done && next(err);
					done = true;
				});
		},
		get_last_30_days = function () {
			curl.get
				.to('www.googleapis.com', 443, '/youtube/analytics/v1/reports')
				.add_header('Authorization', bearer)
				.secured()
				.send({
					ids : 'channel==' + req.params.id,
					'start-date' : moment().subtract('months', 1).format('YYYY-MM-DD'),
					'end-date' : moment().format('YYYY-MM-DD'),
					fields : 'columnHeaders/name,rows',
					metrics : 'views,likes,shares,estimatedMinutesWatched,subscribersGained',
					dimensions : 'day',
					sort : 'day'
				})
				.then(function (status, _data) {
					data.last_30_days = format_data(_data);
					send_response(status, _data);
				})
				.onerror(function (err) {
					!done && next(err);
					done = true;
				});
		},
		get_per_source = function () {
			curl.get
				.to('www.googleapis.com', 443, '/youtube/analytics/v1/reports')
				.add_header('Authorization', bearer)
				.secured()
				.send({
					ids : 'channel==' + req.params.id,
					'start-date' : published_at,
					'end-date' : moment().format('YYYY-MM-DD'),
					fields : 'columnHeaders/name,rows',
					metrics : 'views,estimatedMinutesWatched',
					dimensions : 'insightPlaybackLocationType'
				})
				.then(function (status, _data) {
					data.per_source = format_data(_data);
					send_response(status, _data);
				})
				.onerror(function (err) {
					!done && next(err);
					done = true;
				});
		},
		get_per_continent = function () {
			var i;
			for (i in continents) {
				(function (i) {
					curl.get
						.to('www.googleapis.com', 443, '/youtube/analytics/v1/reports')
						.add_header('Authorization', bearer)
						.secured()
						.send({
							ids : 'channel==' + req.params.id,
							'start-date' : published_at,
							'end-date' : moment().format('YYYY-MM-DD'),
							fields : 'columnHeaders/name,rows',
							metrics : 'views,estimatedMinutesWatched,averageViewDuration',
							dimensions : 'country',
							filters : 'continent==' + continents[i],
							sort : '-estimatedMinutesWatched'
						})
						.then(function (status, _data) {
							data[Object.keys(continents)[--continent_count]] = format_data(_data);
							send_response(status, _data);
						})
						.onerror(function (err) {
							!done && next(err);
							done = true;
						});
				})(i);
			}
		},
		send_response = function (status, _data) {
			if (!done && status !== 200) {
				done = true;
				return res.send(status, _data);
			}

			if (!--total_requests) {
				data.continents = continents;
				res.send(data);
			}
		};

	if (!req.access_token)
		return next('access_token is missing');
	if (!req.params.id)
		return next('id is missing');

	get_published_at();
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