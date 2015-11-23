var mongo = require('mongoskin'),
	config = require(__dirname + '/../config/config').db_mongo,
	db = mongo.db([
		'mongodb://',
		config.host,
		':',
		config.port,
		'/',
		config.name
	].join(''), {
		native_parser : true
	});

module.exports = db;
