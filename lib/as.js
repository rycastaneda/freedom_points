/**
	AS - Auth Server Library
	@description
		If access token exists on cookies,
		automatically get information from
		authentication server then pass it to
		next middleware. Accessible on req.user
	@author Raven Lagrimas
*/

var as_helper = require(__dirname + '/../helpers/auth_server'),
	config = require(__dirname + '/../config/config');

module.exports = function () {
	return function (req, res, next) {
		var set_user = function (err, data) {
				if (err) return next(err);
				req.user = data.user_data;
				req.user_id = req.user._id;
				req.user_data = data.user_data[config.app_id + '_data'];
				next();
			};

		if (req.signedCookies.access_token) {
			as_helper.getInfo({
				access_token : req.signedCookies.access_token,
				self : true
			}, set_user);
		}
		else
			next();
	};
};
