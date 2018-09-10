var express = require('express');
var router = express.Router();
var httpReq = require('request');
var qs = require('querystring');
var amqp = require('amqplib/callback_api');
var consumer_key = process.env.TW_KEY;
var consumer_secret_key = process.env.TW_SECRET;

/* GET Twitter insights. */
router.get('/', function(req, res, next){
	var address = req.connection.localAddress.replace('::ffff:', 'http://');
	var port = req.connection.localPort;
	var redirect_uri = address + ':' + port + '/twitter';

	var oauth = {callback: redirect_uri, consumer_key: consumer_key, consumer_secret: consumer_secret_key};
	var url = 'https://api.twitter.com/oauth/request_token';

	httpReq.post({url: url, oauth: oauth}, function(err, response, body){
		if(!err && response.statusCode == 200){
			if(!req.query.oauth_token){
				var toks = qs.parse(body);
				req.session.token = toks.oauth_token;
				req.session.tokenSecret = toks.oauth_token_secret;
				var auth_url = 'https://api.twitter.com/oauth/authenticate?' + qs.stringify({oauth_token: toks.oauth_token});
				res.redirect(auth_url);
			}
			else{
				req.session.accessToken = req.query.oauth_token;
				req.session.verifier = req.query.oauth_verifier;
				var oauthAgain = {
					consumer_key: consumer_key,
					consumer_secret: consumer_secret_key,
					token: req.session.token,
					token_secret: req.session.tokenSecret,
					verifier: req.session.verifier
				}
				var accessUrl = 'https://api.twitter.com/oauth/access_token';
				httpReq.post({url: accessUrl, oauth: oauthAgain}, function(error, response, body){
					if(!err && response.statusCode == 200){
						console.log(response.statusCode);
						var finalToks = qs.parse(body);
						req.session.token = finalToks.oauth_token;
						req.session.tokenSecret = finalToks.oauth_token_secret;
						req.session.screenName = finalToks.screen_name;
						req.session.userId = finalToks.user_id;
						var oauthFinal = {
							consumer_key: consumer_key,
							consumer_secret: consumer_secret_key,
							token: req.session.token,
							token_secret: req.session.tokenSecret
						}
						var args = {
							screen_name: req.session.screenName,
							user_id: req.session.userId
						}

						getUserInfo(oauthFinal, args, res, redirect_uri);
						}
					else{
						res.redirect(redirect_uri);
					}
				});
			}
		}
		else{
			console.log(body);
			res.send('error');
		}
	});
});

async function getUserInfo(oauthFinal, args, res, redirect_uri){
	var finalUrl = 'https://api.twitter.com/1.1/users/show.json';
	var user;
	var util = require('util');
	var httpUser =  new Promise(function(resolve, reject){
		httpReq.get({url: finalUrl, oauth: oauthFinal, qs: args, json: true}, function(error, response, user){
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

	args = {
		user_id: user.id,
	       	screen_name: user.screen_name,
		count: 150,
		max_id: user.status.id,
		trim_user: true,
		exclude_replies: true,
		include_rts: false
	}

	finalUrl = 'https://api.twitter.com/1.1/statuses/user_timeline.json';

	var httpTweets =  new Promise(function(resolve, reject){
		httpReq.get({url: finalUrl, oauth: oauthFinal, qs: args, json: true}, function(error, response, tweets){
			if(error){
				reject(error);
			}
			else{
				resolve(tweets);
			}
		});
	});

	tweets = await httpTweets
		.then(function(tweets){
			return tweets})
		.catch(function(err){
			console.log(err);
		});

	var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var week = {};

	for(i = 0; i < 7; i++){
		week[days[i]] = {};
		for(j = 0; j < 24; j++){
			var hour = j.toString();
			week[days[i]][hour] =  {
				tweets: 0,
				fv: 0,
				rt: 0
			}
		}
	}

	var followerRatio = (user.followers_count/user.friends_count).toFixed(2);
	var fv = 0;
	var rt = 0;

	for(i = 0; i < tweets.length; i++){
		var fvTemp = tweets[i.toString()].favorite_count;
		var rtTemp = tweets[i.toString()].retweet_count;
		fv += fvTemp;
		rt += rtTemp;
		var date = new Date(tweets[i.toString()].created_at);
		var day = date.getDay();
		week[days[day]][hour].tweets ++;
		week[days[day]][hour].fv += fvTemp;
		week[days[day]][hour].rt += rtTemp;
	}

        avgFv = (fv/tweets.length).toFixed(2);
        avgRt = (rt/tweets.length).toFixed(2);
        percentFv = ((avgFv * 100) / user.followers_count).toFixed(2);
        percentRt = ((avgRt * 100) / user.followers_count).toFixed(2);

        for(i = 0; i < 7; i++){
                for(j = 0; j < 24; j += 3){
                        var hour = j.toString();
                        if(week[days[i]][hour].posts > 0){
                                week[days[i]][hour].fv = week[days[i]][hour].fv / week[days[i]][hour].posts;
                                week[days[i]][hour].rt = week[days[i]][hour].rt / week[days[i]][hour].posts;
                                week[days[i]][hour].tweets = week[days[i]][hour].tweets / week[days[i]][hour].tweets;
                        }
                }
        }

	if(user === undefined){
		res.redirect(redirect_uri);
	}
	else{
		res.render('twitter', {user, week, followerRatio, avgFv, avgRt, percentFv, percentRt});
		amqp.connect('amqp://localhost', function(err, conn){
				conn.createChannel(function(err, ch){
					var q = 'coda';
					var d = new Date();
					var s = d.toString();
					var msg = 'Connessione a Twitter Insights - ' + s;
					ch.assertQueue(q, {durable: false});
					ch.sendToQueue(q, Buffer.from(msg));
				});
				setTimeout(function(){ conn.close()}, 500);
		});
	}
}

module.exports = router;

