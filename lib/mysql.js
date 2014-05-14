var mysql = require('mysql'),
	fn = {
		open : function (config) {
			this.connection = mysql.createConnection(config);
			return this;
		},
		query : function () {
			if (this.connection) {
				this.connection.query.apply(this.connection, arguments);
			} else {
				throw new Error('Establish a connection first by using mysql.open()');
			}
			return this;
		},
		end : function () {
			this.connection.end();
			delete this.connection;
		}
	};

module.exports = fn;
