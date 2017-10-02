var express = require('express');
var router = express.Router();
var path = require('path');
require('map.prototype.tojson');
var dp = require('../dataprocessing.js');

var sessionData = new Map();
var CHECKTIME = 300000;

// checks if session is active
// if not, store
setInterval(function() {
    sessionData.forEach((session, sessionID) => {
        var now = new Date();
        var then = new Date(session.lastBeat);
        if ((now - then) > CHECKTIME) {
            // store and delete
            console.log('no heartbeat sensed - saving');
            dp.writeFile('ieye', sessionID, session.userID, sessionData.get(sessionID));
            sessionData.delete(sessionID);
        } 
    });
}, CHECKTIME);

router.get('/', function(req, res) {
    res.send('ieye');
});

router.post('/heartbeat', function(req, res) {
    var userID = req.body.userID;
    var sessionID = req.body.sessionID;
    if (!sessionData.has(sessionID)) {
        res.end();
        return;
    }
    sessionData.get(sessionID).lastBeat = (new Date());

    res.end();
});

router.get('/sessions', function(req, res) {
    res.json(sessionData.toJSON());
});

router.post('/user', function(req, res) {
    var log = req.body.data;
    var userID = log.userID;
    var sessionID = log.sessionID;

    // set up user data
    sessionData.set(sessionID, log);
    sessionData.get(sessionID).userID = userID;
    sessionData.get(sessionID).environment.windowResizes = [];
    sessionData.get(sessionID).video = [];
    sessionData.get(sessionID).widget = [];
    sessionData.get(sessionID).lastBeat = (new Date());
    sessionData.get(sessionID).exception = [];
    sessionData.get(sessionID).pausedCountUser = 0;
    sessionData.get(sessionID).pausedCountWidget = 0;    
    sessionData.get(sessionID).alerts = [];    
    sessionData.get(sessionID).metrics = [];    

    dp.createUserFile('ieye', userID);

    res.end();
});

router.post('/data/:type', function(req, res) {
    var type = req.params.type;
    var data = req.body.data;
    var sessionID = req.body.sessionID;
    var user = sessionData.get(sessionID);

    switch (type) {
        case 'environment': // array of window resizes
            user.environment.windowResizes = user.environment.windowResizes.concat(data);
            break;
        case 'video': // array of video statusses
            user.video = user.video.concat(data);
            break;
        case 'prediction': // single prediction object
            user.prediction.push(data);
            break;
        case 'widget': // single widget status object
            user.widget.push(data);
            // if paused
            if (data['eventTypeID'] == '4') {
                // if paused by widget:
                if (data['isIEyeEvent'] == '1') {
                    user.pausedCountWidget += 1;
                } else {
                    // if paused by user
                    user.pausedCountUser += 1;
                }
            }            
            break;
        case 'exception':
            user.exception.push(data);
            break;
        case 'metrics':
            user.metrics.push(data);
            break;
        case 'alert':
            user.alerts.push(data);
            break;
        case 'feedback':
            dp.writeFeedback(data);
            break;
        default: // none
    }

    console.log(data);
    res.end();
});

module.exports = router;
