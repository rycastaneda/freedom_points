var fs = require('fs'),
	express = require('express'),
	passport = require('passport'),
    app = express(),

	// middlewares
	methodOverride = require('method-override'),
	cookieParser = require('cookie-parser'),
	responseTime = require('response-time'),
	compression = require('compression'),
	favicon = require('static-favicon'),
	bodyParser = require('body-parser'),
	morgan = require('morgan'),

    util = require(__dirname + '/helpers/util'),
    config = require(__dirname + '/config/config'),
    router = require(__dirname + '/config/router'),
    logger = require(__dirname + '/lib/logger');

logger.log('info', 'initializing FREEDOM. ENV = ', process.env['NODE_ENV']);

require(__dirname + '/config/passport')(passport);

app.disable('x-powered-by');
process.env['NODE_ENV'] !== 'testing' &&	// don't log on file if testing
app.use(morgan({stream : fs.createWriteStream(config.logs_dir + util.currentDate() + '.log', {flags: 'a'})}));
app.use(favicon(config.public_dir + '/favicon.ico'));
app.use(responseTime());
app.use(cookieParser(config.cookie_secret));
app.use(bodyParser({uploadDir : config.temp_dir}));
app.use(compression());
app.use(methodOverride());
app.use(express.static(config.public_dir));
app.use(passport.initialize());

logger.log('verbose', 'setting up router');
router.setup(app, passport);

app.listen(config.port);
logger.log('info', 'Server listening on port : ', config.port);

module.exports = app;
