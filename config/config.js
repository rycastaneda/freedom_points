var path = require('path'),
	config = {
		testing : {
		},
		development : {
			env : 'development',
			port : 8000,
			upload_dir : path.normalize(__dirname + '/../uploads/'),
			logs_dir : path.normalize(__dirname + '/../logs/'),
			temp_dir : path.normalize(__dirname + '/../temp'),
			frontend_server_url : 'http://localhost:8001',
			auth_server : {
				host : 'ec2-54-214-176-172.us-west-2.compute.amazonaws.com',
				port : 80
			},
			cookie_secret : 'c38b1c9ac1c2f9d442f17bb2b77d1a075b617715',
			app_id : '665f627007666750b092f6a68396ed76',
			app_secret : '704a857f886341eb7980a899b18a2687',
			basic_scopes : [
				'web.view',
				'mobile.view',
				'self.view',
				'self.edit',
				'self.delete'
			],
			valid_sources : [
				'google',
				'self'
			],
			googleAuth : {
				clientID 		: '24383833659-b01c43an5ppdu347io4tdfuihc1q6q91.apps.googleusercontent.com',
				clientSecret 	: 'CRUTm9nhLbv8p8RPY3qkNJky',
				callbackURL 	: 'http://localhost:8000/auth/callback'
			},
			db : {
				host : 'localhost',
				user : 'root',
				password : '',
				database : 'freedom'
			}
		},
		staging : {
		},
		production : {
		}
	};


// set development as default environment
!process.env['NODE_ENV'] && (process.env['NODE_ENV'] = 'development');

module.exports = config[process.env['NODE_ENV']];
