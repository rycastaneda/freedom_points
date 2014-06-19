var config = require(__dirname + '/../config/config'),
	logger = require(__dirname + '/../lib/logger'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'), 
	e = function (r, c, cb) {
		var self;
		this.callback	= cb;
		this.report_ids = r;
		this.channel_ids = c;
		this.c_counter = 0;
		this.report_data = {};
		this.channel_data = {};
		this.fetched_rev_share = function (channel, rev_share) {
			self.c_counter++;
			console.log("LOOP done");
			console.log(self.channel_data.length);
			console.log(self.c_counter);

			channel.revenue_share = rev_share;
			self.report_data[channel.report_id].earnings.push(channel);
			if (self.c_counter === self.channel_data.length) {
				self.callback(null,self.report_data);
			}
		};
		this.loop_to_channels = function (err, _data) {
			var selectables = {date_effective : 1, revenue_share : 1, entity_id : 1},
				i, j;
			if (err) return self.callback(err);

			for ( i in _data) {
				self.report_data[_data[i].id] = {
					start_date : _data[i].start_date, 
					end_date : _data[i].end_date,
					earnings : []
				};
			}
			
			if (!self.channel_data.length) 
				return self.callback(null,[]);

			for ( j in self.channel_data) {

				( function( channel, index ) {
					mongo.collection('revenue_share')
	           	 		.find({ entity_id: channel.user_channel_id, 
	           	 				approved: true, 
	           	 				date_effective: {$lte: new Date(self.report_data[channel.report_id].end_date).getTime()} 
	           	 			}, selectables)
	           	 		.sort({date_effective : -1})
	           	 		.toArray(function (err, _data) {
	           	 			
	           	 			if (err) 
		           	 			return self.fetched_rev_share(channel, null);
		           	 		if (!_data.length)
		           	 			return self.fetched_rev_share(channel, null);
		           	 		
		           	 		return self.fetched_rev_share(channel, _data[0]);
	           	 		});
				})(self.channel_data[j], j);
			}
		};
		this.get_report_data = function (err, _data) {
			if (err) return self.callback(err);
			self.channel_data = _data;
			mysql.open(config.db_earnings)
				.query('SELECT id, start_date, end_date from report where id in (?) group by id order by start_date desc', [self.report_ids], self.loop_to_channels)
				.end();
		};
		this.get_earnings = function () {
			mysql.open(config.db_earnings)
				.query('SELECT c1.*, c2.network_name, c2.network_id, c2.recruiter, c2.recruited_date from earnings_report.summed_earnings c1 JOIN freedom.channel c2 ON c1.user_channel_id = c2._id WHERE c1.report_id in (?) and c1.user_channel_id in (?)', [self.report_ids, self.channel_ids], self.get_report_data)
				.end();
		};

		self = this;
	};


module.exports = e;