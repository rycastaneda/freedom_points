(function (blackwidow) {
	var count = 1,
		curl = require(__dirname + '/../lib/curl'),
		mongo = require('mongoskin'),
		db = mongo.db('mongodb://localhost:27017/crawled', {native_parser:true}),
		collection = db.collection('channels', {strict: true}),
		KEY = 'AIzaSyDqWOahd3OSYfctw5pTTcNjQjjfD3QC-s4',

		exit = function (err) {
			// console.dir("ERRROR");
			console.dir(err);
			console.dir("ERRROR");
			process.exit(1);
		},

		get_username = function (a) {
			if (+a.statistics.videoCount <= 0) {
				// console.log('rejected ', a.id);
				return;
			}

			a.date_crawled = +new Date;
			a._id = a.id;
			a.scm = null;
			delete a.id;
			delete a.etag;
			delete a.kind;

			// console.log('Getting username of', a._id);

			curl.get
				.to('www.googleapis.com', 443, '/youtube/v3/search')
				.secured()
				.send({
					part : 'id, snippet',
					channelId : a._id,
					key : KEY
				})
				.then(function (status, data) {
					if (status === 200) {
						if (data.items[0] && !(a.first_video = data.items[0].id.videoId)) return;
						if (data.items[0] && !(a.username = data.items[0].snippet.channelTitle)) return;
						curl.get
							.to('www.youtube.com', 443, '/watch')
							.raw()
							.secured()
							.send({v : a.first_video})
							.then(function (status, data) {
								var match;
								if (status === 200) {
									match = data.match(/\<meta name=(\")?attribution(\")?\s*content=(")?(.*)(")?\/\>/gi);
									if (match && match[0]) {
										match = match[0].substring(31);
										a.scm = match.substring(0, match.length - 2);
									}
								}
								delete a.first_video;
								collection.insert(a, function (err) {
									if (err) return;
									console.log(count++, 'Inserted ' + a.username);
								});
							})
							.onerror(function () {
								delete a.first_video;
								collection.insert(a, function (err) {
									if (err) return;
									console.log(count++, 'Inserted ' + a.username);
								});
							});
					} else {
						console.log(status, 'Error getting first video of channel', a._id);
					}
				})
				.onerror(function (e) {
					console.log('Error getting first video of channel', a._id);
				});
		},


		filter_channels = function (status, data) {
			data.items && data.items
				.forEach(get_username);
			if (data.nextPageToken) {
				curl.get
					.to('www.googleapis.com', 443, '/youtube/v3/channels')
					.secured()
					.send({
						part : 'id, statistics',
						categoryId : data.categId,
						maxResults : 50,
						pageToken : data.nextPageToken,
						fields : 'nextPageToken, items',
						key : KEY
					})
					.then(function (status, _data) {
						_data.categId = data.categId;
						filter_channels(status, _data);
					})
					.onerror(function () {
						console.log('Error on getting next page');
					});
			}
		};

	blackwidow.crawl = function () {
		curl.get
			.to('www.googleapis.com', 443, '/youtube/v3/guideCategories')
			.secured()
			.send({
				part : 'id, snippet',
				regionCode : 'IN',
				key : KEY
			})
			.then(function (status, data) {
				if (status === 200) {
					// var a = data.items[0];
					data.items
						.forEach(function (a) {
							console.log('Crawling category', a.snippet.title);
							curl.get
								.to('www.googleapis.com', 443, '/youtube/v3/channels')
								.secured()
								.send({
									part : 'id, statistics',
									categoryId : a.id,
									maxResults : 50,
									fields : 'nextPageToken, items',
									key : KEY
								})
								.then(function (status, data) {
									if (status === 200) {
										data.categId = a.id;
										console.log('Found', data.items.length, 'channels');
										filter_channels(status, data);
									}
									else {
										console.log(status, 'Error on getting channels of guideCategory', a.snippet.title);
									}
								})
								.onerror(function (e) {
									console.log('Error on getting channels of guideCategory', a.snippet.title);
								});
						});
				} else {
					console.log(status, 'Error on getting guideCategories', data);
				}
			})
			.onerror(function (e) {
				console.log('Error on getting guideCategories', e);
			});
	};

	blackwidow.crawl();


} (this) );
