
//dito  mo kukunin kung anung scope lalagay mo dun sa choose path..
var scopes = {
	all 	: ['self.view, self.edit'],	 	//SCOPES THAT IS COMMON TO ALL USERS
	channel : ['channel.edit', 'channel.add', 'channel.delete', 'channel.view'],
	music	: ['music.add', 'music.edit', 'music.delete', 'music.view'],
	staff	: ['recruiter.all'],
	admin	: ['admin.edit', 'admin.create', 'admin.delete', 'admin.view','user.edit']
};

module.exports = scopes;
