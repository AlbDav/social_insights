var express = require('express');
var router = express.Router();
var httpReq = require('request');
var amqp = require('amqplib/callback_api');

var client_id = process.env.INST_KEY;
var client_secret = process.env.INST_SECRET;

/* GET Instagram insights. */
router.get('/', function(req, res, next){
	var address = req.connection.localAddress.replace('::ffff:', 'http://');
	var port = req.connection.localPort;
	var redirect_uri = address + ':' + port + '/instagram';
	console.log(redirect_uri);
	var auth_url = 'https://api.instagram.com/oauth/authorize/?client_id=' + client_id + '&redirect_uri=' + redirect_uri + '&response_type=code';
	if(!req.query.code){
		res.redirect(auth_url);
	}
	else{
		var options = {
			url: 'https://api.instagram.com/oauth/access_token',
			method: 'POST',
			form: {
				client_id: client_id,
				client_secret: client_secret,
				grant_type: 'authorization_code',
				redirect_uri: redirect_uri,
				code: req.query.code
			}
		};

		var user;

		httpReq(options, function(err, response, body){
			if(!err && response.statusCode == 200){
				var r = JSON.parse(body);
				var access_token = r.access_token;
				
				getUserInfo(access_token, res, redirect_uri);
			}
			else{
				res.redirect(redirect_uri);
			}
		});


	}
});

async function getUserInfo(access_token, res, redirect_uri){
	var user;
	var url = 'https://api.instagram.com/v1/users/self'
	var args = {access_token: access_token};
	var httpUser = new Promise(function(resolve, reject){
		httpReq.get({url: url, qs: args, json: true}, function(error, response, user){
			if(error){
				reject(error);
			}
			else{
				resolve(user);
			}
		});
	});

	user = await httpUser
		.then(function(user){
			return user})
		.catch(function(err){
			console.log(err);
		});

	var posts;
	url = 'https://api.instagram.com/v1/users/self/media/recent';
	args["count"] = 150;
	var httpPosts = new Promise(function(resolve, reject){
		httpReq.get({url: url, qs: args, json: true}, function(error, response, posts){
			if(error){
				reject(error);
			}
			else{
				resolve(posts);
			}
		});
	});

	posts = await httpPosts
		.then(function(posts){
			return posts})
		.catch(function(err){
			console.log(err)
		});


	var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	var week = {};

	for(i = 0; i < 7; i++){
		week[days[i]] = {};
		for(j = 0; j < 24; j += 3){
			var hour = j.toString();
			week[days[i]][hour] = {
				posts: 0,
				likes: 0,
				comments: 0
			}
		}
	}

	var followerRatio = (user.data.counts.followed_by/user.data.counts.follows).toFixed(2);
	var likes = 0;
	var comments = 0;

	for(i = 0; i < posts.data.length; i++){
		var likesTemp = parseInt(posts.data[i.toString()].likes.count);
		var commentsTemp = parseInt(posts.data[i.toString()].comments.count);
		likes += likesTemp;
		comments += commentsTemp;
		var date = new Date(parseInt(posts["data"][i.toString()]["created_time"]) * 1000);
		var day = date.getDay();
		var hour = (Math.floor(date.getHours()/3)*3).toString();
		week[days[day]][hour].posts ++;
		week[days[day]][hour].likes += likesTemp;
		week[days[day]][hour].comments += commentsTemp;
	}

	avgLikes = (likes/posts.data.length).toFixed(2);
	avgComments = (comments/posts.data.length).toFixed(2);
	percentLikes = ((avgLikes * 100) / user.data.counts.followed_by).toFixed(2);
	percentComments = ((avgComments * 100) / user.data.counts.followed_by).toFixed(2);

	for(i = 0; i < 7; i++){
		for(j = 0; j < 24; j += 3){
			var hour = j.toString();
			if(week[days[i]][hour].posts > 0){
				week[days[i]][hour].likes = week[days[i]][hour].likes / week[days[i]][hour].posts;
				week[days[i]][hour].comments = week[days[i]][hour].comments / week[days[i]][hour].posts;
				week[days[i]][hour].posts = week[days[i]][hour].posts / week[days[i]][hour].posts;
			}
		}
	}

	if(user === undefined){
		console.log("c'è stato un problema");
	}
	else{
		res.send(week);
		res.render('instagram', {user, week, followerRatio, avgLikes, avgComments, percentLikes, percentComments});
		amqp.connect('amqp://localhost', function(err, conn){
                                conn.createChannel(function(err, ch){
                                        var q = 'coda';
                                        var d = new Date();
                                        var s = d.toString();
                                        var msg = 'Connessione a Instagram Insights - ' + s;
                                        ch.assertQueue(q, {durable: false});
                                        ch.sendToQueue(q, Buffer.from(msg));
                                });
                                setTimeout(function(){ conn.close()}, 500);
                });
	}
}

module.exports = router;
