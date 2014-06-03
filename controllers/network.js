var config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    curl = require(__dirname + '/../lib/curl');

exports.get_networks = function (req, res, next) {
	var send_response = function (err, result) {
		if (err) return next(err);
		res.send(result);
	};

	if (!req.access_token)
		return next('access_token is missing');

	mysql.open(config.db_freedom)
		.query('SELECT _id, name FROM network', send_response)
		.end();
};

