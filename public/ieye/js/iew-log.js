window.IEWLogger = window.IEWLogger || (function() {
    var module = {};

    // =========================================================================
    // log variables
    //
    // IEYEVERSION IS DEFINED IN CONTROLLER MODULE
    // =========================================================================
    var readyCheck;

    var LOG_ENABLED = true;

    var _route = 'https://moocwidgets.cc/ieye';
    var userRoute = 'https://moocwidgets.cc/ieye/user';
    var dataRoute = 'https://moocwidgets.cc/ieye/data';    
    
    var sessionId = '';
    var referenceNumber = '';
    var sessionStartDate = '';

    // environment
    var _windowSizes = [];
    var _windowDataSentBusy = false;
    var _videoStatus = [];
    var _videoDataSentBusy = false;

    // video
    var pauseCount = 0;
    var isIEyeEvent = '0';

    // settings
    var METRIC_UPDATE = null;
    const METRIC_UPDATE_INTERVAL = 1000; // interval to update in ms
    const MAX_METRIC_COUNT = 10; // # metrics to store locally before sending

    // time of heartbeat messages (ms) to send.
    // MUST BE SMALLER THAN SERVER'S CHECKTIME VALUE (300000)
    const HEARTBEAT_TIME = 30000; 
    var _heartbeatBusy = false;

    /**
     * Initialize logger
     */
    function init() {
        readyCheck = setInterval(function() {
                clearInterval(readyCheck);
                // if visiting a new URL or refreshing same page
                if (!sessionStorage.getItem('storedURL') || sessionStorage.getItem('storedURL') !== document.URL) {
                    sessionStorage.setItem('storedURL', document.URL);
                    sessionStorage.setItem('unitsVisited', 1);
                    if (sessionStorage.getItem('sessionId')) {
                        sessionStorage.removeItem('sessionId');
                    }
                } else {
                    // if changing units
                    var ucount = parseInt(sessionStorage.getItem('unitsVisited'));
                    sessionStorage.setItem('unitsVisited', ucount+1);
                }

                $(window).on('beforeunload', function() {
                    sessionStorage.removeItem('storedURL');
                });

                sessionStartDate = new Date();
                referenceNumber = createReferenceNumber();
                sessionId = getSessionId();

                // set local cookie
                $.cookie('sessionID', getSessionId());
                $.cookie('userID', getUserId());
                
                if (parseInt(sessionStorage.getItem('unitsVisited')) === 1) {
                    var initialLog = {
                        'userID': getUserId(),
                        'sessionID': getSessionId(),
                        'sessionStartTime': sessionStartDate.toISOString(),
                        'pageTitle': document.title,
                        'pageURL': document.URL,
                        'environment': getEnvironment(),
                    };

                    $.post(userRoute, {data: initialLog}, function() {
                        console.log('Initial log sent');
                    });
                }

                if (parseInt(sessionStorage.getItem('unitsVisited')) > 1) {
                    clearInterval(METRIC_UPDATE);
                    clearInterval(HEARTBEAT_UPDATE);
                }           

                METRIC_UPDATE = setInterval(function() {
                    // console.log(getSessionId());
                    _updateEnvironment();
                    _updateVideoStatus();
                }, METRIC_UPDATE_INTERVAL);

                HEARTBEAT_UPDATE = setInterval(function() {
                    if (!_heartbeatBusy) {
                        console.log(getSessionId());
                        $.post(_route + '/heartbeat', {userID: getUserId(), sessionID: getSessionId()}, function() {
                            _heartbeatBusy = false;
                        });
                    }
                }, HEARTBEAT_TIME);                     
                
                isReady = true;                     
        }, 100);
    }

    // =========================================================================
    // update functions
    // =========================================================================
    /**
     * Updates the user's environment
     * if window size changes, store and send to server if 
     * MAX_METRIC_COUNT of changes have been stored.
     * 
     * format of metric:
     *  {
     *      "winHeight": int,
     *      "winWidth": int,
     *      "time": timestamp
     *  }
     * 
     * @param {bool} forceSend force send data instead checking array length.
     */
    function _updateEnvironment(forceSend=false) {
        var w = window.innerWidth;
        var h = window.innerHeight;

        var changed = false;
        if (_windowSizes.length === 0) {
            changed = true;
        } else {
            var last = _windowSizes[_windowSizes.length - 1];
            if (last.winHeight !== h || last.winWidth !== w) {
                changed = true;
            }
        }

        if (changed) {
            _windowSizes.push({
                'winHeight': h,
                'winWidth': w,
                'time': Date.now(),
            });            
        }

       if ((forceSend || _windowSizes.length >= MAX_METRIC_COUNT) && !_windowDataSentBusy) {
            console.log('send server window sizes: ' + _windowSizes);
            $.post(dataRoute + '/environment', {sessionID: getSessionId(), data: _windowSizes}, function() {
                console.log('send success');
                _windowSizes = [];
                _windowDataSentBusy = false;
            });
        }     
    }

/**
     * Updates the status of the current video.
     * The current video is the video the user is viewing.
     * format of metric
     *  {
            "ID": "",
            "currentTime": "",
            "length": "",
            "size": "",
            "speed": "",
            "subtitles": "",
            "fullscreen": "Y/N"
     *  }
     * @param {bool} forceSend force send data instead checking array length
     */
    function _updateVideoStatus(forceSend=false) {
        // console.log('update: ' + _videoStatus.length);
        var pState = vcontrol.getPlayerStateFromID(vcontrol.getCurrentPlayerID());
        if (typeof pState === 'undefined') {
            return;
        }
        var changed = false;
        if (_videoStatus.length === 0) {
            changed = true;
        } else {
            var last = _videoStatus[_videoStatus.length - 1];
            
            var id = vcontrol.getCurrentPlayerID();
            var speed = pState.speed;
            var cc = !pState.captionsHidden;
            var fs = pState.videoFullScreen.fullScreenState ? 'Y' : 'N';

            if (last.ID != id || last.speed != speed || last.subtitles != cc || last.fullscreen != fs) {
                changed = true;
            }

            if (vcontrol.getCurrentPlayerState() != last.videoStatus) {
                console.log('new status: ' + vcontrol.getCurrentPlayerState());
                console.log('last: '+ last.videoStatus);  
                changed = true;
            }
        }

        var videoPlayStart = 'n/a';
        if (vcontrol.getCurrentPlayerState() === 'play') {
            videoPlayStart = vcontrol.getCurrentPlayer().currentTime;
        }

        var videoPlayStop = 'n/a';
        if (vcontrol.getCurrentPlayerState() === 'pause' || vcontrol.getCurrentPlayerState() === 'ended') {
            videoPlayStop = vcontrol.getCurrentPlayer().currentTime;
        }        

        if (changed) {
            vcontrol.updateOverlay();
            _videoStatus.push({
                'ID': vcontrol.getCurrentPlayerID(),
                'time': Date.now(),
                'videoStatus': vcontrol.getCurrentPlayerState(), 
                'currentTime': vcontrol.getCurrentPlayer().currentTime,
                'length': vcontrol.getCurrentPlayer().duration(),
                'totalPlayTime': vcontrol.getTotalPlayTimeFromID(vcontrol.getCurrentPlayerID()),
                'videoPlayStart': videoPlayStart,
                'videoPlayStop': videoPlayStop,
                'size': 'unknown',
                'speed': pState.speed,
                'subtitles': !pState.captionsHidden,
                'fullscreen': pState.videoFullScreen.fullScreenState ? 'Y' : 'N',
            });            
        }

        if ((forceSend || _videoStatus.length >= MAX_METRIC_COUNT) && !_videoDataSentBusy) {
            console.log(forceSend);
            console.log(_videoStatus.length);
            _videoDataSentBusy = true;
            // TODO: send to server
            console.log('send server video status: ' + _videoStatus);
            $.post(dataRoute + '/video', {sessionID: getSessionId(), data: _videoStatus}, function() {
                console.log('Send success');
                _videoStatus = [];
                _videoDataSentBusy = false;
                console.log(_videoStatus.length);
            });
        }  
    }

    // =========================================================================
    // init functions
    // =========================================================================
    /**
     * @return{String} Returns the user's edX id
     */
    function getUserId() {
        return analytics.user().id();
    }

    /**
     * returns session id. Creates it first if it doesn't exist.
     * @return {String} session ID
     */
    function getSessionId() {
        if (sessionStorage.getItem('sessionId')) {
            sessionId = sessionStorage.getItem('sessionId');
        } else {
            sessionId = 'IEYE.' + IEYEVERSION + '.' + referenceNumber + '.' + sessionStartDate.valueOf() + '.' + getFormattedDate(sessionStartDate); 
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Returns a *unique* reference number
     * @return {String} reference number
     */
    function createReferenceNumber() {
        var firstPart = (Math.random() * 46656) | 0;
        var secondPart = (Math.random() * 46656) | 0;
        firstPart = ('000' + firstPart.toString(36)).slice(-3);
        secondPart = ('000' + secondPart.toString(36)).slice(-3);
        return (firstPart + secondPart).toUpperCase();
    }

    /**
     * Returns formatted date
     * @param {*} dt date object to be formatted
     * @return {String} formatted date
     */
    function getFormattedDate(dt) {
        var d = ('0' + dt.getDate()).slice(-2);
        var m = ('0' + (dt.getMonth()+1)).slice(-2);
        var y = dt.getFullYear();
        var hh = ('0' + dt.getHours()).slice(-2);
        var mm = ('0' + dt.getMinutes()).slice(-2);
        var ss = ('0' + dt.getSeconds()).slice(-2);
        return d+m+y+hh+mm+ss;
    }

    /**
     * Detect and return the user's environment
     * @return {Object} User's environment
     */
    function getEnvironment() {
        // detect operating system.
        var OS = 'unknown';
        var browser = 'unkown';
        var version = 'unknown';

        if (window.navigator.userAgent.indexOf('Windows NT 10.0') != -1) OS = 'Windows 10';
        if (window.navigator.userAgent.indexOf('Windows NT 6.2') != -1) OS = 'Windows 8';
        if (window.navigator.userAgent.indexOf('Windows NT 6.1') != -1) OS = 'Windows 7';
        if (window.navigator.userAgent.indexOf('Windows NT 6.0') != -1) OS = 'Windows Vista';
        if (window.navigator.userAgent.indexOf('Windows NT 5.1') != -1) OS = 'Windows XP';
        if (window.navigator.userAgent.indexOf('Windows NT 5.0') != -1) OS = 'Windows 2000';
        if (window.navigator.userAgent.indexOf('Mac') != -1) OS = 'Mac/iOS';
        if (window.navigator.userAgent.indexOf('X11') != -1) OS = 'UNIX';
        if (window.navigator.userAgent.indexOf('Linux') != -1) OS = 'Linux';
        
        // detect browser & version
        var N= navigator.appName, ua= navigator.userAgent, tem;
        var M= ua.match(/(opera|chrome|safari|firefox|msie|trident)\/?\s*(\.?\d+(\.\d+)*)/i);
        // eslint-disable-next-line
        if (M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) {M[2]=tem[1];}
        M= M? [M[1], M[2]]: [N, navigator.appVersion, '-?'];
        browser = M[0];
        version = M[1];

        return {
            'OS': OS,
            'browser': browser,
            'browserVersion': version,
            'screenHeigth': screen.height,
            'screenWidth': screen.width,
        };
    }

    // =========================================================================
    // Functions for send log
    // =========================================================================
    /**
     * Sends log to the dataroute (see top vars).
     * @param {String} type type of log i.e. prediction/widget/exception/video
     * @param {Object} data data to send
     */
    function sendLog(type, data) {
        if (LOG_ENABLED) {
            $.post(dataRoute + '/' + type, {sessionID: getSessionId(), data: data}, function(req, res) {
                console.log('sent '+ type + ' succes');
            });
        }
    }
    // =========================================================================
    // public
    // =========================================================================
    module.init = function() {
        init();
    };

    module.isReady = function() {
        return isReady;
    };

    module.getSessionId = function() {
        return getSessionId();
    };

    module.enableLog = function() {
        LOG_ENABLED = true;
    };

    module.disableLog = function() {
        LOG_ENABLED = false;
    };

    module.logPrediction = function(data) {
        sendLog('prediction', data);
    };

    module.logWidgetStatus = function(data) {
        sendLog('widget', data);
    };

    // focus-out [1], low/no gaze data [2]
    module.logException = function(data) {
        sendLog('exception', data);       
    }; 

    module.logChoice = function(choice) {
        var data = {
            'choiceRemembered': (choice) ? 'allow' : 'disallow',
            'choiceTimeStamp': Date.now(),
        };

        sendLog('choice', data);
    };

    /**
     * Logs the status of the widget
     * @param {*} status status of widget
     * @param {*} isIEyeEvent if event is triggered by ieye
     */
    module.logWidgetStatus = function(status) {
        if (!vcontrol.isReady() || !vcontrol.getCurrentPlayer()) {
        return;
        }

        // eslint-disable-next-line
        function findStatusCode(s) {
        var wstatus = ['', 'allow', 'skip', 'start', 'pause', 'resume', 'end', 'disallow'];
        return wstatus.indexOf(s) > -1 ? wstatus.indexOf(s) : 'unknown';
        }

        if (status === 'pause') { 
            isIEyeEvent = (pausedByIEye) ? '1' : '0';
        } else if (status === 'resume') {
            isIEyeEvent = (isIEyeEvent === '1') ? isIEyeEvent : '0';
        } else {
            isIEyeEvent = '0';
        }

        var data = {
            'videoID': vcontrol.getCurrentPlayerID(),
            'eventTimeStamp': Date.now(),
            'videoTime': vcontrol.getCurrentTime(),
            'videoDuration': vcontrol.getDuration(),
            'eventTypeID': findStatusCode(status),
            'eventType': status,
            'isIEyeEvent': isIEyeEvent,
        };

        sendLog('widget', data);
    };

    module.logBannedUser = function(reason) {
        var initialLog = {
            'userID': getUserId(),
            'sessionID': getSessionId(),
            'sessionStartTime': sessionStartDate.toISOString(),
            'pageTitle': document.title,
            'pageURL': document.URL,
            'environment': getEnvironment(),
            'banned': true,
            'reason': reason,
        };

        $.post(userRoute, {data: initialLog}, function() {
            console.log('User does not meet specs sent');
        });        
    };

    module.updateVideoStatus = function() {
        _updateVideoStatus(true);
    };

    module.logMetrics = function(data) {
        sendLog('metrics', data);
        console.log('sending metrics...');
    };

    return module;
} ) ();
