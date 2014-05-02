var mysql = require('mysql');

module.exports = function (config) {
	return function () {
		var connection = mysql.createConnection(config);
		connection.connect();
		connection.query.apply(connection, arguments);
		connection.end();
	}
};
