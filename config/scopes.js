module.exports = {
	all 	: 'self.view,self.edit',
	channel : 'channel.edit, channel.add, channel.delete, channel.view',
	staff	: 'recruiter.all',
	music	: 'music.add, music.edit, music.delete, music.view',
	admin	: 'admin.edit_all, admin.create_all, admin.delete_all, admin.view_all, user.edit',
	payout	: 'payout.view, payout.allow'
};
