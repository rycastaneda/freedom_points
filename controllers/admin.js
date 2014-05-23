var config = require(__dirname + '/../config/config'),
	mysql = require(__dirname + '/../lib/mysql'),
	mongo = require(__dirname + '/../lib/mongoskin'),
	util = require(__dirname + '/../helpers/util'),
	as_helper = require(__dirname + '/../helpers/auth_server')
	;

exports.find_applicants = function(req, res, next){
    var data = {},
        stat,
        page=1,
        size=10;

    switch(req.query.status){
        case "all": stat = "1 or partnership_status = 0"; break;
        case "verified": stat = 1; break;
        default: stat = 0; break;
    }

    if(!isNaN(req.query.page)) {
        page = req.query.page;;
    }

    page = (page - 1) * 10;

    if(!isNaN(req.query.size)) {
        size = req.query.size;
        if(size >=100 ) {
            size = 100;
        }
    }
    console.log("SELECT _id, channel_name, last30_days, channel_username from channel where partnership_status ="+stat+" LIMIT "+page+","+size+";");

    mysql.open(config.db_freedom)
        .query("SELECT _id, channel_name, last30_days, channel_username from channel where partnership_status ="+stat+" LIMIT "+page+","+size+";",function(err, result){
            res.send(200, result);
        }).end();
};


exports.accept_applicant = function(req, res, next){
    var data = {},
    update = function () {
        mongo.collection('partnership')
            .update(
                {channel : req.params.id},
                {$set : {
                            approver: {
                                admin : {
                                    status : true
                                }
                            }
                        }
                },
                {},
                send_response
                );
    },
    send_response = function(err, countModif) {
        console.log(err);
        console.log(countModif);
        if(err) next(err);

        if(countModif > 0)
            res.send(200, 'Admin acceptance successful.');
        else
            res.send(400, "Admin acceptance failed.");
    };

    update();

}
