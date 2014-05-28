var config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server'),

    // Stability : 2, if something went wrong
    // check this thing first
    crypto = require('crypto'),
    check_admin = function(req){
        var decipher,
            decrypted,
            hex,
            split;

        if(req.cookies.uid){
            decipher = crypto.createDecipher('aes-256-cbc', '4NydotTv');

            hex = req.cookies.uid.split('.');

            decipher.update(hex[0], 'hex', 'utf8');
            decrypted = decipher.final('utf8');
            if(decrypted === "admin=true") return 0;
            else if(decrypted === "admin=default") return 1;
            else return false;

        } else return false;
    }
	;

exports.verify_uid = function(req,res,next){
    var decrypted = check_admin(req);

    if(decrypted === 0)
        res.send(200, {message : "parsed", type: "admin"});
    else if(decrypted === 1)
        res.send(200, {message: "parsed", type:"default"});
    else
        res.send(400, {message: "error with uid"});
};



exports.find_applicants = function(req, res, next){
    var data = {},
        stat,
        page=1,
        size=10,
        query = function(req, res){
            if(!isNaN(req.query.page)) {
                page = req.query.page;;
            }

            page = (page - 1) * 10;

            if(!isNaN(req.query.size)) {
                size = parseInt(req.query.size,10);
                if(size >=100 ) {
                    size = 100;
                }
            }

            mysql.open(config.db_freedom)
                .query("SELECT _id, channel_name, last30_days, channel_username from channel where partnership_status = 0 LIMIT ? , ?;",[page, size],function(err, result){
                    if(err) next(err);

                    res.send(200, result);
                }).end();
        };

    if(check_admin(req) === 0)
        as_helper.hasScopes(req.signedCookies.access_token, 'admin.view_all', query, next);
    else res.send(401, {message : "Unauthorized"});
};


exports.accept_applicant = function(req, res, next){
    var data = {},
    update = function () {
        mongo.collection('partnership')
            .update(
                {channel : req.params.id},
                {$set : {
                            "approver.admin.status" : false
                        }
                },
                {},
                send_response
                );
    },
    send_response = function(err, countModif) {
        if(err) next(err);

        if(countModif > 0)
            check_all_approvs();
        else
            res.send(400, {message: "Admin acceptance failed"});
    },
    check_all_approvs = function() {
        mongo.collection('partnership')
            .find({channel: req.params.id})
            .toArray(function(err, result) {
                if(err) next(err);

                var approvers = result[0].approver;

                // check if all status are true
                for(var i in approvers){

                    //  if one of the status are false, other approvers haven't approved yet
                    if(approvers[i].status === false){
                        res.send(200, {message: "Admin Acceptance successful"});
                        return;
                    }
                }

                // all approvers have status  === true, now update SQL database;
                mysql.open(config.db_freedom)
                    .query("UPDATE channel SET partnership_status = 1 where _id = ?",[req.params.id], function(err, result){
                        if(err) next(err);

                        res.send(200,{message: "All approvers verified."});
                    })
                    .end();
            });
    }
    ;

    if(check_admin(req) === 0)
        as_helper.hasScopes(req.signedCookies.access_token, 'admin.add_all', update, next);
    else res.send(401, {message : "Unauthorized"});

}
