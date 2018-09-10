var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('client-sessions');
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware');
var amqp = require('amqplib/callback_api');
var fs = require('fs');

var indexRouter = require('./routes/index');
var instaRouter = require('./routes/instagram');
var tweetRouter = require('./routes/twitter');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(session({
  cookieName: 'session',
  secret: '1qaz2wsx3edc4rfv',
  duration: 30*60*1000,
  activateDuration: 5*60*1000
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/instagram', instaRouter);
app.use('/twitter', tweetRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

amqp.connect('amqp://localhost', function(err, conn){
		conn.createChannel(function(err, ch){
			var q = 'coda';
			ch.assertQueue(q, {durable: false});
			ch.consume(q, function(msg){
				fs.appendFile('log.txt', msg.content.toString() + '\n', function(err){
					if(err) throw err;
					console.log("Log file saved");
				});
			}, {noAck: true});
		});
});

module.exports = app;
