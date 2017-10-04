var jsonfile = require('jsonfile'); 
jsonfile.spaces = 4;
var fs = require('fs');
var pug = require('pug');

var path = require('path');

var dataPath = '../moocdata/';
var logPath = path.join(dataPath, 'logs');
var userFeedbackFile = path.join(dataPath, 'UserFeedback');

var squirreleyePath = path.join(dataPath, 'squirreleye');
var ieyePath = path.join(dataPath, 'ieye');

// check if data folder exists
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
    console.log('Using' + dataPath + ' data folder');
}    

if (!fs.existsSync(squirreleyePath)) {
    console.log('creating ' + squirreleyePath +' data folder');
    fs.mkdirSync(squirreleyePath);
}

if (!fs.existsSync(ieyePath)) {
    console.log('creating ' + ieyePath +' data folder');
    fs.mkdirSync(ieyePath);
}

if (!fs.existsSync(logPath)) {
    console.log('creating ' + logPath +' data folder');
    fs.mkdirSync(logPath);
}    

if (!fs.existsSync(userFeedbackFile)) {
    fs.writeFile(userFeedbackFile, '', function(err) {
        if (err) {
            console.log(err);
        }
        console.log('Create userFeedbackFile ' + userFeedbackFile + ' success');
    });
}        

/**
 * 
 * @param {*} widgetType 
 * @param {*} userID 
 */
var createUserFile = function(widgetType, userID) {
    var userFile = (widgetType === 'sqeye') ? squirreleyePath : ieyePath;
    userFile = path.join(userFile, userID);
    if (!fs.existsSync(userFile)) {
        fs.writeFile(userFile, '', function(err) {
            if (err) {
                console.log(err);
            }
            console.log('Create userfile ' + userFile + ' success');
        });
    }    
};

/**
 * Appends the session log to the user file.
 * @param {String} widgetType 'sqeye' or 'ieye'
 * @param {*} sessionID SessionID for the log
 * @param {*} userID User
 * @param {object} dataToWrite data to write to file.
 */
var writeFile = function(widgetType, sessionID, userID, dataToWrite) {
    var filepath = (widgetType === 'sqeye') ? squirreleyePath : ieyePath;
    jsonfile.writeFile(path.join(filepath, userID), dataToWrite, {flag: 'a'}, function(err) {
        if (err) {
            console.log(err);
        }
    });    
};

/**
 * Appends feedback to the feedback file
 * @param {*} data Feedback from users on the widget.
 */
var writeFeedback = function(data) {
    jsonfile.writeFile(userFeedbackFile, data, {flag: 'a'}, function(err) {
        if (err) {
            console.log(err);
        }
    });
};

/**
 * Stores the history pages as html
 * @param {JSON} historyData history session data from ieye.js
 * @param {Boolean} store if true, save history to file.
 * @param {Function} onFinish call when write finishes, required when store=true.
 * @return {String} returns the data string that was parsed.
 */
var parseHistory = function(historyData, store, onFinish) {
    if (historyData.size === 0) {
        return 'Empty.';
    }

    var firstEntry = Array.from(historyData.entries())[0][1]; // get first added session (0=key 1=val)
    var historyFile = path.join(logPath, (new Date(firstEntry.sessionStartTime)).toDateString() + ' ('+firstEntry.sessionStartTime.replace(/:/g, '.') +').txt');

    // use this to render html history to file (raw history is without styling)
    // var output = pug.renderFile('views/rawhistory.pug', {historyData: data});

    var output = '';

    var bucket = new Map();
    var usersPerDateHour = new Map();
    var keys = Object.keys(historyData).reverse();
    for (var i = 0; i < keys.length; i++) {
        var session = historyData[keys[i]];
        var date = new Date(session.sessionStartTime);
        var h = date.toLocaleDateString() + ', ' + date.getHours() + ':00:00';
        if (!bucket.has(h)) {
            bucket.set(h, []);
        }
        bucket.get(h).push(session);

        if (!usersPerDateHour.has(h)) {
            usersPerDateHour.set(h, new Map());
        }
        usersPerDateHour.get(h).set(session.userID, '');
    }

    bucket.forEach((b, k) => {
        if (b.length > 0) { 
            output += k + ',';
            output += 'sessions: ' + b.length+ ',';
            output += 'users: ' + usersPerDateHour.get(k).size;                         
            output += '\n';

            b.forEach((session) => {
                var useState = 'n/a';
                for (var wi = 0; wi < session.widget.length; wi++) {
                    var wstate = session.widget[wi];
                    if (wstate.eventType === 'allow' || wstate.eventType === 'disallow') {
                        useState = wstate.eventType;
                    }
                }
                    var sDate = (new Date(session.sessionStartTime));
                    var h = ('0' + sDate.getHours()).slice(-2);
                    var m = ('0' + sDate.getMinutes()).slice(-2);
                    var s = ('0' + sDate.getSeconds()).slice(-2);
                
                    output += session.userID + ',';
                    output += session.sessionID + ',';
                    output += session.reactionType+ ',';
                    output += useState+ ',';
                    output += session.sessionStartTime + ',';
                    output += session.environment.browser + ' ('+session.environment.browserVersion+')'+ ',';
                    output += 'mobile: ' + session.environment.mobile+ ',';
                    output += 'banned: ' + session.banned+ ',';
                    output += '\n';
            });
            output += '--------------------------------------------------------------------------------------\n';
        }
    });

    if (store) {
        fs.writeFile(historyFile, output, function(err, data) {
            if (err) {
                return console.log(err);
            }
            if (typeof onFinish !== 'undefined') {
                onFinish();            
            }
        });    
    }
    
    return output;
};

module.exports.createUserFile = createUserFile;
module.exports.writeFile = writeFile;
module.exports.writeFeedback = writeFeedback;
module.exports.parseHistory = parseHistory;
