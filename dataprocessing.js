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
 * @param {*} data history session data from ieye.js
 * @param {*} onFinish call when write finishes
 */
var storeHistory = function(data, onFinish) {
    var firstEntry = Array.from(data.entries())[0][1]; // get first added session (0=key 1=val)
    var historyFile = path.join(logPath, (new Date()).toDateString() + ' ('+firstEntry.sessionStartTime.replace(/:/g, '.') +').html');

    var output = pug.renderFile('views/history.pug', {historyData: data});

    fs.writeFile(historyFile, output, function(err, data) {
        if (err) {
            return console.log(err);
        }
        if (typeof onFinish !== 'undefined') {
            onFinish();            
        }
    });      
};

module.exports.createUserFile = createUserFile;
module.exports.writeFile = writeFile;
module.exports.writeFeedback = writeFeedback;
module.exports.storeHistory = storeHistory;
