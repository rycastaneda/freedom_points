var mysql = require('mysql'),
	config;

module.exports = function (_config) {
	var fn = function () {
		var connection = mysql.createConnection(config);
		connection.connect();
		connection.query.apply(connection, arguments);
		connection.end();
	};
	fn.open = function () {
		this.connection = mysql.createConnection(config);
		return this;
	};
	fn.query = function () {
		if (this.connection) {
			this.connection.query.apply(this.connection, arguments);
		} else {
			throw new Error('Establish a connection first by using mysql.open()');
		}
		return this;
	};
	fn.end = function () {
		this.connection.end();
		delete this.connection;
	};
	config = _config;
	return fn;
};
