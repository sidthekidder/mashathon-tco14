/**
 * Module dependencies.
 */

var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var passport = require('passport');
var methodOverride = require('method-override');
/**
 * Controllers (route handlers).
 */

var homeController = require('./controllers/home');
var userController = require('./controllers/user');

/**
 * API keys and Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

var _ = require('lodash');
var mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 */

mongoose.connect(secrets.db, function(e) {
  if(e) console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');

  var MongoStore = require('connect-mongo')(session);
  var flash = require('express-flash');
  var path = require('path');
  var expressValidator = require('express-validator');
  var connectAssets = require('connect-assets');

  /**
   * Create Express server.
   */

  var app = express();

  /**
   * CSRF whitelist.
   */

  var csrfExclude = ['/inc', '/dec'];

  /**
   * Express configuration.
   */

  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');
  app.use(compress());
  app.use(connectAssets({
    paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')]
  }));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(expressValidator());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: secrets.sessionSecret,
    store: new MongoStore({ url: secrets.db, auto_reconnect: true })
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use(function(req, res, next) {
    // CSRF protection.
    if (_.contains(csrfExclude, req.path)) return next();
    csrf(req, res, next);
  });
  app.use(function(req, res, next) {
    // Make user object available in templates.
    res.locals.user = req.user;
    next();
  });
  app.use(function(req, res, next) {
    // Remember original destination before login.
    var path = req.path.split('/')[1];
    if (/auth|login|logout|signup|fonts|favicon/i.test(path)) {
      return next();
    }
    req.session.returnTo = req.path;
    next();
  });
  app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

  /**
   * Main routes.
   */

  app.get('/', passportConf.isAuthenticated, homeController.index);
  app.get('/highscores', homeController.highscores);
  app.get('/guesswho', passportConf.isAuthenticated, homeController.guesswho);
  app.get('/knowledge', passportConf.isAuthenticated, homeController.knowledge);
  app.get('/geofriends', passportConf.isAuthenticated, homeController.geofriends);
  app.get('/friendly', passportConf.isAuthenticated, homeController.friendly);
  app.get('/stalker', passportConf.isAuthenticated, homeController.stalker);
  app.post('/inc', passportConf.isAuthenticated, homeController.inc);
  app.post('/dec', passportConf.isAuthenticated, homeController.dec);
  app.get('/login', userController.getLogin);
  app.post('/login', userController.postLogin);
  app.get('/logout', userController.logout);

  /**
   * OAuth sign-in routes.
   */

  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location','friends_birthday','friends_education_history','friends_work_history','friends_likes','friends_status','friends_photos','friends_location','friends_hometown','friends_relationships'] }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });

  /**
   * 500 Error Handler.
   */

  app.use(errorHandler());

  /**
   * Start Express server.
   */

  app.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
});