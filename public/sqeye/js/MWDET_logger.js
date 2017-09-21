// eslint-disable-next-line
window.METRIC_UPDATE;
window.HEARTBEAT_UPDATE;
window.mwdet_logger = window.mwdet_logger || (function() {
    // if (window.METRIC_UPDATE) {
    //     console.log('>>>>>>>>>>>>>new interval');
    //     clearInterval(window.METRIC_UPDATE);
    //     window.METRIC_UPDATE = null;
    // } 
    // window.METRIC_UPDATE = null;    

    var module = {};

    // =========================================================================
    // log variables
    //
    // SQUIRRELEYE VERSION IS DEFINED IN CONTROLLER MODULE
    // =========================================================================
    var readyCheck;
    var isReady = false;

    var _route = 'https://moocwidgets.cc/sqeye';
    var userRoute = 'https://moocwidgets.cc/sqeye/user';
    var dataRoute = 'https://moocwidgets.cc/sqeye/data';

    var sessionId = '';
    var referenceNumber = '';
    var sessionStartDate = '';

    // environment
    var _prevWindow = undefined;
    var _windowSizes = [];
    var _windowDataSentBusy = false;

    var _prevVideoStatus = undefined;
    var _videoStatus = [];
    var _videoDataSentBusy = false;

    // video
    var pauseCount = 0;

    // focus
    _pageFocus = true;

    // settings
    var LOG_ENABLED = true; // determines if log should be sent to server. Sessions are still kept with this disabled.
    // var METRIC_UPDATE = null;
    const METRIC_UPDATE_INTERVAL = 1000; // interval to update in ms
    
    // # metrics to store locally before sending
    // 1 means immidiate sending
    const MAX_METRIC_COUNT = 1; 

    // time of heartbeat messages (ms) to send.
    // MUST BE SMALLER THAN SERVER'S CHECKTIME VALUE (300000)
    const HEARTBEAT_TIME = 30000; 
    var _heartbeatBusy = false;

    /**
     * Initialize logger
     */
    function init() {
        readyCheck = setInterval(function() {
            if (analytics && analytics.user) {
                clearInterval(readyCheck);

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
                        'sessionStartTime': (new Date(sessionStartDate)).toISOString(),
                        'pageTitle': document.title,
                        'pageURL': document.URL,
                        'environment': moocwidget.envChecker.getEnvironment(),
                    };

                    $.post(userRoute, {data: initialLog}, function() {
                        console.log('Initial log sent');
                    });
                }

                // check for user's focus on the page
                $(window).focus(() => {
                    updateFocus(true);
                });

                $(window).blur(() => {
                    updateFocus(false);
                });

                $(window).on('click', () => {
                    updateFocus(true);
                });

                document.addEventListener('visibilitychange', handleVisibilityChange, false);

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
                        _heartbeatBusy = true;
                        $.post(_route + '/heartbeat', {userID: getUserId(), sessionID: getSessionId()}, function() {
                            _heartbeatBusy = false;
                        });
                    }
                }, HEARTBEAT_TIME);                     

                isReady = true;                
            }
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
        if (_prevWindow === undefined) {
            changed = true;
        } else {
            var last =_prevWindow;
            if (last.winHeight !== h || last.winWidth !== w) {
                changed = true;
            }
        }

        if (changed) {
            var chndObject = {
                'winHeight': h,
                'winWidth': w,
                'time': Date.now(),
            };
            _windowSizes.push(chndObject);
            _prevWindow = chndObject;

            $('#msgOverlay').css('width', w);
            $('.MWDET-overlay').css('width', w);
            
            vcontrol.updateOverlay();
        }

        if ((forceSend || _windowSizes.length >= MAX_METRIC_COUNT) && !_windowDataSentBusy) {
            console.log('send server window sizes: ' + _windowSizes);
            _windowDataSentBusy = true;
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
        var pState = vcontrol.getPlayerDataStateFromID(vcontrol.getCurrentPlayerID());
        if (typeof pState === 'undefined') {
            return;
        }
        var changed = false;
        if (_prevVideoStatus === undefined) {
            changed = true;
        } else {
            var last = _prevVideoStatus;
            
            var id = vcontrol.getCurrentPlayerID();
            var speed = pState.speed;
            var cc = !pState.captionsHidden;
            var fs = pState.videoFullScreen.fullScreenState ? 'Y' : 'N';

            if (last.ID != id || last.speed != speed || last.subtitles != cc || last.fullscreen != fs) {
                changed = true;
            }

            if (vcontrol.getCurrentPlayerStatus() != last.videoStatus) {
                console.log('new status: ' + vcontrol.getCurrentPlayerStatus());
                console.log('last: '+ last.videoStatus);  
                changed = true;
            }
        }

        if (changed) {
            vcontrol.updateOverlay();
            var chndObject = {
                'ID': vcontrol.getCurrentPlayerID(),
                'time': Date.now(),
                'videoStatus': vcontrol.getCurrentPlayerStatus(), 
                'currentTime': vcontrol.getCurrentPlayer().currentTime,
                'length': vcontrol.getCurrentPlayer().duration(),
                'size': 'unknown',
                'speed': pState.speed,
                'subtitles': !pState.captionsHidden,
                'fullscreen': pState.videoFullScreen.fullScreenState ? 'Y' : 'N',
            };
            _prevVideoStatus = chndObject;
            _videoStatus.push(chndObject);            
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

    /**
     * Handle visibility change
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            updateFocus(false);
        } else {
            updateFocus(true);
        }
    }

    /**
     * update focus state
     * @param {*} fState state of focus
     */
    function updateFocus(fState) {
        if ($('.video').length > 0) {
            if (fState === false) {         
                if (vcontrol.getCurrentPlayerStatus() === 'play' && mwdet.mwdetIsEnabled()) {
                    mwdet.visualAlertLoop();
                    mwdet.audioAlertLoop();
                    module.logException({
                        'videoID': vcontrol.getCurrentPlayerID(),
                        'exceptionType': 1,
                        'exceptionDescription': 'focus-out',
                        'videoStatus': vcontrol.getCurrentPlayerStatus(),
                        'videoTime': vcontrol.getCurrentTime(),
                        'videoDuration': vcontrol.getDuration(),                
                    });                    
                }
            } else {
                mwdet.stopAudioAlertLoop();
                mwdet.stopVisualAlertLoop();
            }
        }
        // update prev focus
        _pageFocus = fState;        
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
            sessionId = 'SQUIRRELEYE.' + MWDET_VERSION + '.' + referenceNumber + '.' + sessionStartDate.valueOf() + '.' + getFormattedDate(sessionStartDate); 
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
        var d = ('0' + (new Date(dt)).getDate()).slice(-2);
        var m = ('0' + ((new Date(dt)).getMonth()+1)).slice(-2);
        var y = (new Date(dt)).getFullYear();
        var hh = ('0' + (new Date(dt)).getHours()).slice(-2);
        var mm = ('0' + (new Date(dt)).getMinutes()).slice(-2);
        var ss = ('0' + (new Date(dt)).getSeconds()).slice(-2);
        return d+m+y+hh+mm+ss;
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

    module.logBannedUser = function(reason) {
        console.log("[sqeye] logging banned user...");
        sessionStartDate = new Date();
        referenceNumber = createReferenceNumber();
        sessionId = getSessionId();        
        var initialLog = {
            'userID': getUserId(),
            'sessionID': getSessionId(),
            'sessionStartTime': (new Date(sessionStartDate)).toISOString(),
            'pageTitle': document.title,
            'pageURL': document.URL,
            'environment': moocwidget.envChecker.getEnvironment(),
            'banned': true,
            'reason': reason,
        };

        $.post(userRoute, {data: initialLog}, function() {
            console.log('User does not meet specs sent');
        });        
    };

    return module;
} ) ();
