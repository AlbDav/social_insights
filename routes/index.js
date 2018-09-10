var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	var address = req.connection.localAddress.replace('::ffff:', 'http://');
	var port = req.connection.localPort;
	var redirect_uri = address + ':' + port;
	var instagram_uri = redirect_uri + '/instagram';
	var twitter_uri = redirect_uri + '/twitter';
	res.render('index', {instagram_uri, twitter_uri});
});

module.exports = router;
