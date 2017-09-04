var jsonfile = require('jsonfile'); 
jsonfile.spaces = 4;
var fs = require('fs');
var path = require('path');

var logsPath = 'logs/';
var dataPath = '../moocdata/';
var squirreleyePath = path.join(dataPath, 'squirreleye');
var ieyePath = path.join(dataPath, 'ieye');

// create log file path, replace all : occurences for Windows
// var logfile = logsPath + (new Date()).toISOString().replace(/:/g, '.');

// // check if log folder exists
// if (!fs.existsSync(logsPath)) {
//     console.log('Creating logs folder for log4js');
//     fs.mkdirSync(logsPath);
// }

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

// // Logger to write logs to file.
// // to change the filename or folder, change the filename part below.
// log4js.configure({
//     appenders: [
//         {type: 'console'},
//         {type: 'file', filename: logfile},
//     ],
// });

/**
 * 
 * @param {*} widgetType 
 * @param {*} userID 
 */
var createUserFile = function(widgetType, userID) {
    var userFile = (widgettype === 'sqeye') ? squirreleyePath : ieyePath;
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
 * @param {*} sessionID SessionID for the log
 * @param {*} userID User
 */
var writeFile = function(sessionID, userID) {
    var filepath = (widgettype === 'sqeye') ? squirreleyePath : ieyePath;
    jsonfile.writeFile(path.join(filepath, userID), sessionData.get(sessionID), {flag: 'a'}, function(err) {
        if (err) {
            console.log(err);
        }
    });    
};

module.exports.createUserFile = createUserFile;
module.exports.writeFile = writeFile;
