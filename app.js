/**
 * Created by Wing on 13-2-17.
 * This is a nodejs server.
 * Most of the code is boilerplate such as necessary dependencies declarations,
 * setup of ip, port.
 */

// dependencies:
var express = require('express');
var url = require('url');
var ip = require('ip');
var path = require('path');
var http = require('http');
var https = require('https');
var fs = require('fs');
var bodyParser = require('body-parser');
var mlog = require('morgan'); // request mlog
var log4js = require('log4js'); // common mlog (logging our messages to file)
require('map.prototype.tojson');
var cors = require('cors');

var jsonfile = require('jsonfile'); // responsible for writing data to file
jsonfile.spaces = 4;

// region DATA COLLECTION
// ------------------------------------------------------
var logsPath = 'logs/';
var dataPath = '../moocdata/';
var squirreleyePath = path.join(dataPath, 'squirreleye');
var ieyePath = path.join(dataPath, 'ieye');

// create log file path, replace all : occurences for Windows
var logfile = logsPath + (new Date()).toISOString().replace(/:/g, '.');

var userData = new Map();
// ------------------------------------------------------
// endregion

var logger = log4js.getLogger();

// process.argv is the list of arguments given when executing the server.
// format: npm start
// Check if port given is a number
var port = (process.argv[2] !== undefined && !isNaN(process.argv[2])) ? parseInt(process.argv[2]) : 8080;
var ipaddress = ip.isPrivate(ip.address()) ? 'localhost' : ip.address();
// var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

var app = express();

var corsOptions = {
    origin: 'https://edge.edx.org',
    optionsSuccessStatus: 200,
};

// =============================================================================
var CHECKTIME = 300000;
// =============================================================================


app.use(cors());

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));

// set up of the body parser
// this dependency is required to send json files
// the limit of 5mb means that it allows the posting of files >= 5mb
// this high limit is needed for the video tracking part as we send a lot of data there.
// eslint-disable-next-line
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({
    limit: '5mb',
    extended: true,
    parameterLimit: 5000000,
}));
app.locals.pretty = true;

app.use(mlog('common'));

var options = {
    key: fs.readFileSync('key.key'),
    cert: fs.readFileSync('cert.pem'),
    ca: fs.readFileSync('chain.crt'),
};

var server = https.createServer(options, app);

/**
 * Sets up the app.
 * Initializes the logs folder if needed.
 */
server.listen(port, ipaddress, function() {
    // check if log folder exists
    if (!fs.existsSync(logsPath)) {
        console.log('Creating logs folder for log4js');
        fs.mkdirSync(logsPath);
    }

    // check if data folder exists
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);

        if (!fs.existsSync(squirreleyePath)) {
            console.log('creating ' + squirreleyePath +' data folder');
            fs.mkdirSync(squirreleyePath);
        }

        if (!fs.existsSync(ieyePath)) {
            console.log('creating ' + ieyePath +' data folder');
            fs.mkdirSync(ieyePath);
        }

        console.log('Using' + dataPath + ' data folder');
    }    

    // Logger to write logs to file.
    // to change the filename or folder, change the filename part below.
    log4js.configure({
        appenders: [
            {type: 'console'},
            {type: 'file', filename: logfile},
        ],
    });

    // checks if session is active
    // if not, store
    setInterval(function() {
        userData.forEach((session, sessionID) => {
            var now = new Date();
            var then = new Date(session.lastBeat);
            if ((now - then) > CHECKTIME) {
                // store and delete
                writeFile(sessionID, session.userID);
                userData.delete(sessionID);
            } 
        });
    }, CHECKTIME);

    logger.info('[%s] Node server started on %s:%d',
        (new Date()).toLocaleTimeString(), ipaddress, port);
});

// =============================================================================
// data collection
// =============================================================================
/**
 * Appends the session log to the user file.
 * @param {*} sessionID SessionID for the log
 * @param {*} userID User
 */
function writeFile(sessionID, userID) {
    jsonfile.writeFile(path.join(dataPath, userID), userData.get(sessionID), {flag: 'a'}, function(err) {
        if (err) {
            console.log(err);
        }
    });    
}

app.post('/user/:widgettype', function(req, res) {
    var log = req.body.data;
    var userID = log.userID;
    var sessionID = log.sessionID;
    var widgettype = req.params.widgettype;

    // set up user data
    userData.set(sessionID, log);
    userData.get(sessionID).userID = userID;
    userData.get(sessionID).environment.windowResizes = [];
    userData.get(sessionID).video = [];
    userData.get(sessionID).prediction = [];
    userData.get(sessionID).widget = [];
    userData.get(sessionID).lastBeat = (new Date());
    userData.get(sessionID).exception = [];
    userData.get(sessionID).widgetType = widgettype;

    // check if userfile exists
    
    var userFile = (widgettype === 'squirreleye') ? squirreleyePath : ieyePath;
    userFile = path.join(userFile, userID);
    if (!fs.existsSync(userFile)) {
        fs.writeFile(userFile, '', function(err) {
            if (err) {
                console.log(err);
            }
            console.log('Create userfile ' + userFile + ' success');
        });
    }    

    res.end();
});

app.post('/data/:type', function(req, res) {
    var type = req.params.type;
    var data = req.body.data;
    var sessionID = req.body.sessionID;
    var user = userData.get(sessionID);

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
            break;
        case 'exception':
            user.exception.push(data);
            break;
        default: // none
    }

    console.log(data);
    res.end();
});

app.post('/heartbeat', function(req, res) {
    var userID = req.body.userID;
    var sessionID = req.body.sessionID;
    if (!userData.has(sessionID)) {
        return;
    }
    userData.get(sessionID).lastBeat = (new Date());

    res.end();
});

app.post('/endsession', function(req, res) {
    var userID = req.body.userID;
    var sessionID = req.body.sessionID;
    jsonfile.writeFile(path.join(dataPath, userID), userData.get(sessionID), {flag: 'a'}, function(err) {
        if (err) {
            console.log(err);
        }
    });
    res.end();
});

app.get('/data', function(req, res) {
    res.json(userData.toJSON());
});
