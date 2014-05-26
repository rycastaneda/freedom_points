/**
	AS - Auth Server Library
	@description
		If access token existst on cookies,
		automatically get information from
		authentication server then pass to
		next middleware
	@author Raven Lagrimas
*/

var as_helper = require(__dirname + '/../helpers/auth_server');

module.exports = function () {
	return function (req, res, next) {
		var set_user = function (err, data) {
				if (err) return next(err);
				req.user = data;
				req.user_id = data.user_data._id;
				next();
			};

		if (req.signedCookies.access_token) {
			as_helper.getInfo({
				access_token : req.signedCookies.access_token,
				self : true
			}, set_user);
		} else {
			next();
		}
	};
};
