module.exports = {
	all 	: 'self.view,self.edit',
	partner : 'channel.edit, channel.add, channel.delete, channel.view',
	staff	: 'recruiter.all',
	music	: 'music.add, music.edit, music.delete, music.view',
	admin	: 'admin.edit_all, admin.create_all, admin.delete_all, admin.view_all, user.edit',
	payout	: 'payout.view, payout.allow',
	network	: 'network.accept, network.view, network.approve_share, network.get_share, user.view'
};


 // {"description" : "Basic web view for freedom.", "scope" : "a5986070d58ba777f4897a045c56bb71.web.view", "created_at" : 1395073747299 },
 // {"description" : "Basic recruiter scope.", "scope" : "a5986070d58ba777f4897a045c56bb71.recruiter.all", "created_at" : 1395073747299 },
 // {"description" : "Admin edit all scope.", "scope" : "a5986070d58ba777f4897a045c56bb71.admin.edit_all", "created_at" : 1395073747299 },
 // {"description" : "Admin create all scope.", "scope" : "a5986070d58ba777f4897a045c56bb71.admin.create_all", "created_at" : 1395073747299 },
 // {"description" : "Admin delete all scioe.", "scope" : "a5986070d58ba777f4897a045c56bb71.admin.delete_all", "created_at" : 1395073747299 },
 // {"description" : "Admin view all scope.", "scope" : "a5986070d58ba777f4897a045c56bb71.admin.view_all", "created_at" : 1395073747299 },
 // {"description" : "Edits all user data scope.", "scope" : "a5986070d58ba777f4897a045c56bb71.user.edit", "created_at" : 1395073747299 },
 // {"description" : "Views all user data scope.", "scope" : "a5986070d58ba777f4897a045c56bb71.user.view", "created_at" : 1395073747299 }


 // {"description" : "Basic payout view.", "scope" : "a5986070d58ba777f4897a045c56bb71.payout.view", "created_at" : 1395073747299 },
 // {"description" : "Allows downloading of payout.", "scope" : "a5986070d58ba777f4897a045c56bb71.payout.allow", "created_at" : 1395073747299 },
// { "description" : "Can add people's channel list", "scope" : "a5986070d58ba777f4897a045c56bb71.channel.add", "created_at" : 1395073747299}

// { "description" : "Network can accept partnership from channels.", "scope" : "a5986070d58ba777f4897a045c56bb71.network.accept", "created_at" : +new Date}

// {"description" : "Network can approve new revenue share",  "scope" : "a5986070d58ba777f4897a045c56bb71.network.approve_share", "created_at" : +new Date}
// {"description" : "Network can get all revenue share",  "scope" : "a5986070d58ba777f4897a045c56bb71.network.get_share", "created_at" : +new Date}
