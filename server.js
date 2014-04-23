var fs = require('fs'),
	passport = require('passport'),
    app = require('express')(),

	// middlewares
	methodOverride = require('method-override'),
	cookieParser = require('cookie-parser'),
	responseTime = require('response-time'),
	compression = require('compression'),
	favicon = require('static-favicon'),
	bodyParser = require('body-parser'),
	morgan = require('morgan'),

	//
    config = require(__dirname + '/config/config'),
    logger = require(__dirname + '/lib/logger'),
    util = require(__dirname + '/helpers/util');

logger.log('info', 'initializing FREEDOM Backend. ENV = ', process.env['NODE_ENV']);

require(__dirname + '/config/passport')(passport);

app.disable('x-powered-by');
process.env['NODE_ENV'] !== 'testing' &&	// don't log on file if testing
app.use(morgan({stream : fs.createWriteStream(config.logs_dir + util.currentDate() + '.log', {flags: 'a'})}));
app.use(favicon(config.public_dir + '/favicon.ico'));
app.use(bodyParser({uploadDir : config.temp_dir}));
app.use(cookieParser(config.cookie_secret));
app.use(responseTime());
app.use(compression());
app.use(methodOverride());
app.use(passport.initialize());;
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', config.frontend_server_url);
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
	res.setHeader('Access-Control-Allow-Credentials', true);
	if (req.method === 'OPTIONS')
		return res.send(200);
	next();
});

require(__dirname + '/config/router')(app, passport);

app.listen(config.port);

module.exports = app;

logger.log('info', 'Server listening on port : ', config.port);
