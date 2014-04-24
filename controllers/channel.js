var config = require(__dirname + '/../config/config'),
    logger = require(__dirname + '/../lib/logger'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),
    qs = require('querystring'),
    http = require('http'),
	passport;


//channel related operations, kelangan ng authentication from google para makapagperform ng edit 
//nakalagay yung access token na gagamitin for each channel dun sa respective table rows nila
function editVideo(video_id, next ) {


};

function editPlaylist( playlist_id, next ) {


};

function editChannelInfo( channel_id, next ) {


};

exports.setPassport = function (pp) {
	passport = pp;
};


exports.getChannelStats = function(req,res,next) {


};

exports.addChannelToUser = function(req,res,next) {


};

//will just return the stats of each channel associated with the logged in user
exports.leaderBoardPerUser = function(req,res,next) {
	var data = util.chk_rqd(['user_id'], req.body, next);


};