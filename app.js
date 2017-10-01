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
var logger = log4js.getLogger();

// process.argv is the list of arguments given when executing the server.
// format: npm start
// Check if port given is a number
var port = (process.argv[2] !== undefined && !isNaN(process.argv[2])) ? parseInt(process.argv[2]) : 8000;
var ipaddress = ip.isPrivate(ip.address()) ? 'localhost' : ip.address();
// var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

var app = express();

var corsOptions = {
    origin: 'https://edge.edx.org',
    optionsSuccessStatus: 200,
};

app.use(cors());

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
// app.use('/static', express.static(path.join(__dirname, 'public')));

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

// =============================================================================
// Routes
var dp = require('./dataprocessing.js');
var sqeyeRoutes = require('./routes/sqeye.js');
var ieyeRoutes = require('./routes/ieye.js');
app.use('/sqeye', sqeyeRoutes);
app.use('/ieye', ieyeRoutes);

// =============================================================================

// var options = {
//     key: fs.readFileSync('./ssl/key.key'),
//     cert: fs.readFileSync('./ssl/cert.pem'),
//     ca: fs.readFileSync('./ssl/chain.crt'),
// };

// var server = https.createServer(options, app);

// /**
//  * Sets up the app.
//  * Initializes the logs folder if needed.
//  */
// server.listen(port, ipaddress, function() {
//     logger.info('[%s] Node server started on %s:%d',
//         (new Date()).toLocaleTimeString(), ipaddress, port);
// });

app.listen(port, ipaddress, function() {
    logger.info('[%s] Node server started on %s:%d',
        (new Date()).toLocaleTimeString(), ipaddress, port);
});
