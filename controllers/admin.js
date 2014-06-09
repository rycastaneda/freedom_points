var config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server');

exports.find_applicants = function(req, res, next){
    var data = {},
        stat,
        page = 1,
        size = 10,
		queryApplicants = "SELECT _id, user_id, linked_cms, channel_username, channel_name, network_id, " +
						"network_name, last30_days, total_views, total_comments, total_subscribers, " +
						"overall_goodstanding, created_at FROM channel WHERE partnership_status = 0 "+
						"ORDER BY created_at DESC LIMIT ?, ?;",
        query = function () {

            if (req.query.page && !isNaN(req.query.page)) {
                page = req.query.page;;
            }

			page = (page - 1) * 10;

            if (req.query.page && !isNaN(req.query.size)) {
                size = parseInt(req.query.size,10);

                if (size >= 100) {
                    size = 100;
                }
            }

            mysql.open(config.db_freedom)
                .query(queryApplicants, [page, size], function (err, result) {
                    if (err) return next(err);

                    res.send(200, result);
                })
				.end();
	}

    if (req.is_admin)
        as_helper.has_scopes(req.signedCookies.access_token, 'admin.view_all', query, next);
    else
		next("Unauthorized");
};

exports.accept_applicant = function (req, res, next) {
    var data = {},
    update = function () {
        mongo.collection('partnership')
            .update(
                {channel : req.body.id},
                {$set : {
                            "approver.admin.status" : true
                        }
                },
                {},
                send_response
			);
    },
    send_response = function (err, countModif) {
        if(err) return next(err);

        if(countModif > 0)
            check_all_approvs();
        else
			next("Admin acceptance failed");
    },
    check_all_approvs = function () {
        mongo.collection('partnership')
            .find({channel: req.body.id})
            .toArray(function (err, result) {
                if (err) return next(err);

                var approvers = result[0].approver;

                // check if all status are true
                for (var i in approvers){

                    //  if one of the status are false, other approvers haven't approved yet
                    if (approvers[i].status === false){
                        return res.send(200, {message: "admin"});
                    }
                }

                // all approvers have status  === true, now update SQL database;
                mysql.open(config.db_freedom)
                    .query("UPDATE channel SET partnership_status = 1 where _id = ?", [req.body.id], function (err, result){
                        if (err) return next(err);

                        res.send(200, {message: "all"});
                    })
                    .end();
            });
    };

    if (req.is_admin)
        as_helper.has_scopes(req.signedCookies.access_token, 'admin.add_all', update, next);
    else
		next("Unauthorized");
};
