var request = require('request');
var graph = require('fbgraph');
var _ = require('lodash');
var User = require('../models/User');

/**
 * GET /
 * home page.
 */

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

/**
 * GET /highscores
 * highscores page.
 */

exports.highscores = function(req, res) {
  User.find().sort({
    score: -1
  }).limit(10).exec(function(err, scores) {
    res.render('highscores', {
      title: 'Highscores',
      scores: scores
    });
  });
};

/**
 * GET /guesswho
 * guess who game mode
 */

exports.guesswho = function(req, res) {
  var token = _.find(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  graph.get(req.user.facebook + '/friends', function(err, friends) {
    var randomNo = Math.floor((Math.random() * friends.data.length) + 1);
    var selectedFriend = friends.data[randomNo];

    graph.get(selectedFriend.id, function(err, personData) {
      if (err) return next(err);

      if (personData.birthday == null ||
          personData.education == null ||
          personData.hometown == null ||
          personData.gender == null ||
          personData.location == null) {
        res.redirect('/guesswho');
      }
      res.render('guesswho', {
        title: 'Guess Who',
        mysteryName: personData.name,
        mysteryBirthday: personData.birthday,
        mysteryEducation: personData.education[0],
        mysteryHometown: personData.hometown,
        mysteryLocation: personData.location,
        mysteryGender: personData.gender
      });
    });    
  });
};

/**
 * GET /knowledge
 * knowledge home page
 */

exports.knowledge = function(req, res) {
  var token = _.find(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  graph.get(req.user.facebook + '/friends', function(err, friends) {

    /* get 4 unique random numbers */
    var r1 = Math.floor((Math.random() * friends.data.length));
    var r2 = Math.floor((Math.random() * friends.data.length));
    var r3 = Math.floor((Math.random() * friends.data.length));
    var r4 = Math.floor((Math.random() * friends.data.length));
    if (r2 == r1 || r2 == r3 || r2 == r4) {
      r2 = Math.floor((Math.random() * friends.data.length) + 1);
    }
    if (r3 == r1 || r3 == r2 || r3 == r4) {
      r3 = Math.floor((Math.random() * friends.data.length) + 1);
    }
    if (r4 == r1 || r4 == r2 || r4 == r3) {
      r4 = Math.floor((Math.random() * friends.data.length) + 1);
    }

    /* holds the random friends array */
    var randomFriendsarr = [];
    randomFriendsarr.push(friends.data[r1]);
    randomFriendsarr.push(friends.data[r2]);
    randomFriendsarr.push(friends.data[r3]);
    randomFriendsarr.push(friends.data[r4]);

    /* randomFriendsarr[ansa] is the correct answer */
    var ansa = Math.floor((Math.random() * 4));

    graph.get(randomFriendsarr[ansa].id + '/statuses', function(err, resp) {
      if (err) return next(err);

      if (resp.data[0].message == null && resp.data[1]) {
        resp.data[0].message = resp.data[1].message;
      }

      res.render('knowledge', {
        title: 'Knowledge',
        problemStatement: resp.data[0].message,
        option1: randomFriendsarr[0].name,
        option2: randomFriendsarr[1].name,
        option3: randomFriendsarr[2].name,
        option4: randomFriendsarr[3].name,
        correctAns: randomFriendsarr[ansa].name
      });
    });
  });
};

/**
 * GET /geofriends
 * geofriends home page
 */

exports.geofriends = function(req, res) {
  var token = _.find(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  graph.get(req.user.facebook + '/friends', function(err, friends) {

    /* get 4 unique random numbers */
    var r1 = Math.floor((Math.random() * friends.data.length));
    var r2 = Math.floor((Math.random() * friends.data.length));
    var r3 = Math.floor((Math.random() * friends.data.length));
    var r4 = Math.floor((Math.random() * friends.data.length));
    if (r2 == r1 || r2 == r3 || r2 == r4) {
      r2 = Math.floor((Math.random() * friends.data.length) + 1);
    }
    if (r3 == r1 || r3 == r2 || r3 == r4) {
      r3 = Math.floor((Math.random() * friends.data.length) + 1);
    }
    if (r4 == r1 || r4 == r2 || r4 == r3) {
      r4 = Math.floor((Math.random() * friends.data.length) + 1);
    }

    /* holds the random friends array */
    var randomFriendsarr = [];
    randomFriendsarr.push(friends.data[r1]);
    randomFriendsarr.push(friends.data[r2]);
    randomFriendsarr.push(friends.data[r3]);
    randomFriendsarr.push(friends.data[r4]);

    /* randomFriendsarr[ansa] is the correct answer */
    var ansa = Math.floor((Math.random() * 4));
    var selectedFriend = randomFriendsarr[ansa];

    graph.get(selectedFriend.id, function(err, personData) {
      if (err) return next(err);

      if (personData.location == null) { 
        /* if its all null, simply try again */
        res.redirect('/geofriends');
      } else {
        graph.get(personData.location.id, function(err, loc) {

          res.render('geofriends', {
            title: 'Geofriends',
            locname: loc.name,
            latitude: loc.location.latitude,
            longitude: loc.location.longitude,
            option1: randomFriendsarr[0].name,
            option2: randomFriendsarr[1].name,
            option3: randomFriendsarr[2].name,
            option4: randomFriendsarr[3].name,
            correctAns: personData.name
          });
        });
      }
    });
  });
};


/**
 * GET /friendly
 * mutual friends home page
 */

exports.friendly = function(req, res) {
  var token = _.find(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  graph.get(req.user.facebook + '/friends', function(err, friends) {

    /* get 2 different random numbers */
    var r1 = Math.floor((Math.random() * friends.data.length));
    var r2 = Math.floor((Math.random() * friends.data.length));
    if (r1 == r2) {
      r1 = Math.floor((Math.random() * friends.data.length));
    }

    graph.get(friends.data[r1].id + '/friends/' + friends.data[r2].id, function(err, resp) {
      var result = '';
      if (resp.data.length == 0) {
        result = 'no';
      } else {
        result = 'yes';
      }
      res.render('friendly', {
        title: 'Friendly',
        opt: result,
        f1: friends.data[r1].name,
        f2: friends.data[r2].name
      });
    });
  });
};


/**
 * GET /stalkers
 * relationship status page
 */

exports.stalker = function(req, res) {
  var token = _.find(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  graph.get(req.user.facebook + '/friends', function(err, friends) {
    var randomNo = Math.floor((Math.random() * friends.data.length) + 1);
    var selectedFriend = friends.data[randomNo];

    graph.get(selectedFriend.id, function(err, personData) {
      if (err) return next(err);
      var rStatus = '';
      if (personData.relationship_status == null) {
        rStatus = 'single';
      } else {
        rStatus = personData.relationship_status;
      }
      rStatus = rStatus.toLowerCase();
      res.render('stalker', {
        title: 'Stalker',
        name: personData.name,
        status: rStatus
      });
    });
  });
};

/**
 * POST /inc
 * increase API call
 */

exports.inc = function(req, res) {
  switch(req.body.type) {
    case 'knowledge': res.locals.user.score += 10;
                      break;
    case 'friendly': res.locals.user.score += 1;
                      break;
    case 'stalker': res.locals.user.score += 1;
                      break;
    case 'geofriends': res.locals.user.score += 5;
                      break;
    case 'guesswho': res.locals.user.score += 20;
                      break;
  }
  console.log('new score now: ' + res.locals.user.score);

  User.findById(req.user.id, function(err, user) {
    user.score = res.locals.user.score;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Score Increased' });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write({ 'status': 'OK' });
      res.end();
    });
  });
};

/**
 * POST /dec
 * decrease API call
 */

exports.dec = function(req, res) {
  switch(req.body.type) {
    case 'knowledge': res.locals.user.score -= 10;
                      break;
    case 'friendly': res.locals.user.score -= 1;
                      break;
    case 'stalker': res.locals.user.score -= 1;
                      break;
    case 'geofriends': res.locals.user.score -= 5;
                      break;
    case 'guesswho': res.locals.user.score -= 20;
                      break;
  }
  if (res.locals.user.score <= 0) {
    res.locals.user.score = 0;
  }
  console.log('new score now: ' + res.locals.user.score);

  User.findById(req.user.id, function(err, user) {
    user.score = res.locals.user.score;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Score Decreased' });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write({ 'status': 'OK' });
      res.end();
    });
  });
};