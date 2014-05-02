
//dito  mo kukunin kung anung scope lalagay mo dun sa choose path..
var scopes = {
	all 	: [''],	 	//SCOPES THAT IS COMMON TO ALL USERS
	channel : ['channel.edit','channel.add','channel.delete','channel.view'],
	music	: ['music.add','music.edit','music.delet','music.view'],
	staff	: ['recruiter.all'],
	admin	: ['admin.edit_all','admin.create_all','admin.delete_all','admin.view_all']
};
module.exports = scopes;