var logger = require(__dirname + '/../lib/logger'),
	user = require(__dirname + '/../controllers/user');

exports.setup = function (app) {
    app.get('/auth/google', user.auth_google());
    app.get('/auth/youtube', user.auth_youtube());
    app.get('/auth/callback', user.auth_callback);

    app.get('*', function (req, res) {
        res.redirect('/index.html');
    });

    // error handling
    app.use(function (err, req, res, next) {
        logger.log('warn', err.message);
        return res.send(err.code || 400, {message : err.message});
    });

	logger.log('verbose', 'done setting up router');
};
