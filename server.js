var fs = require('fs'),
	passport = require('passport'),
    express = require('express'),
    app = express(),

    config = require(__dirname + '/config/config'),
    logger = require(__dirname + '/lib/logger'),
    util = require(__dirname + '/helpers/util');

logger.log('info', 'initializing FREEDOM Backend. ENV = ', process.env['NODE_ENV']);

require(__dirname + '/config/passport')(passport);

app.disable('x-powered-by');
app.use(require('morgan')({format : 'dev', immediate : true}));
app.use(require('morgan')({format : 'dev'}));
app.use(require('body-parser')({uploadDir : config.temp_dir}));
app.use(require('cookie-parser')(config.cookie_secret));
app.use(require('response-time')());
app.use(require('compression')());
app.use(require('method-override')());
app.use(passport.initialize());
app.use(require(__dirname + '/lib/cors')(config.frontend_server_url));
app.use(require(__dirname + '/config/router')(express.Router(), logger, passport));

app.listen(config.port);

module.exports = app;

logger.log('info', 'Server listening on port : ', config.port);
