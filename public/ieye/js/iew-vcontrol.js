/**
 * IEyeWidget.
 * Video control module.
 */

window.vcontrol = window.vcontrol || (function() {
    var isReady = false;
    var module = {};

    var playerIDs = [];
    var firstPlayTimes = [];
    var totalPlayTimes = [];

    var currentPlayerID = '';

    var currentPlayerState;

    // callback function when video state changes
    var setOnStateChange;

    /**
     * Initialize video control module
     * @param {*} callback function to call when video states changes
     */
    function init(callback) {
        setOnStateChange = callback;

        // collect all video IDs.
        $.each($('.video'), function(i, v) {
            console.log('video id:' + v.getAttribute('id'));
            playerIDs[i] = v.getAttribute('id');
            firstPlayTimes[i] = 0;
        });

        currentPlayerID = playerIDs[0];

        // we can only control 1 video at a time. 
        // pause and lose focus of other videos if a new video is played.
        $('.video').on('play', function(e) {
            var newID = e.currentTarget.getAttribute('id');
            // change in video
            if (newID !== currentPlayerID) {
                // pause other videos
                $.each(playerIDs, function(i, pID) {
                    if (pID !== newID) {
                        $('#' + pID).data().videoPlayerState.videoPlayer.pause();
                    }
                });

                currentPlayerID = newID;
                // eslint-disable-next-line
                // setTimeout(() => {setOnStateChange('play');}, 1000);
            }

            processStateChange('play');
            setOnStateChange('play');
            currentPlayerState = 'play';

            // onStateChange() is used by edX so this is 
            // a less neat but faster than an interval version of that:
            // external function setOnStateChange is set when initialized above (by controller).
            /* eslint-disable */

            // $('#' + currentPlayerID).on('play', () => {currentPlayerState = 'play'; processStateChange('play'); setOnStateChange('play');  });
            // $('#' + currentPlayerID).on('pause', () => {currentPlayerState = 'pause'; processStateChange('pause'); setOnStateChange('pause');  });
            // $('#' + currentPlayerID).on('seek', () => {currentPlayerState = 'seek'; processStateChange('seek'); setOnStateChange('seek');  });
            // $('#' + currentPlayerID).on('ended', () => {currentPlayerState = 'ended'; processStateChange('ended'); setOnStateChange('ended');  });    

            /* eslint-enable */               
            isReady = true;
        });

        $('.video').on('pause', function(e) {
            var id = e.currentTarget.getAttribute('id');
            if (id !== currentPlayerID) {
                return;
            }
            processStateChange('pause');
            setOnStateChange('pause');
            currentPlayerState = 'pause';
        });

        $('.video').on('seek', function(e) {
            var id = e.currentTarget.getAttribute('id');
            if (id !== currentPlayerID) {
                return;
            }
            processStateChange('seek');
            setOnStateChange('seek');
            currentPlayerState = 'seek';
        });
        
        $('.video').on('ended', function(e) {
            var id = e.currentTarget.getAttribute('id');
            if (id !== currentPlayerID) {
                return;
            }
            processStateChange('ended');
            setOnStateChange('ended');
            currentPlayerState = 'ended';
        });        
    }

    /**
     * process state change
     * @param {*} state 
     */
    function processStateChange(state) {
        // set first play time
        var playerIndex = playerIDs.indexOf(currentPlayerID);
        if (state === 'play') {
            if (firstPlayTimes[playerIndex] === 0) {
                firstPlayTimes[playerIndex] = new Date();
                totalPlayTimes[playerIndex] = 0;
            }
        } else if (state === 'pause' || state === 'ended') {
            var now = new Date();
            // update totalplaytime
            totalPlayTimes[playerIndex] = Math.round((now - firstPlayTimes[playerIndex]) / 1000);
        }

        IEWLogger.updateVideoStatus();
    }

    /**
     * @return {*} Returns current player object
     */
    function getCurrentPlayer() {
        if (currentPlayerID.length > 0) {
            return $('#' + currentPlayerID).data().videoPlayerState.videoPlayer;
        }
    }

    // =========================================================================
    // public functions
    // =========================================================================

    module.init = function(callback) {
        init(callback);
    };    

    module.isReady = function() {
        return isReady;
    };

    module.getPlayerIDs = function() {
        return playerIDs;
    };

    module.getFirstPlayTimeFromID = function(ID) {
        return firstPlayTimes[playerIDs.indexOf(ID)];
    };

    module.getTotalPlayTimeFromID = function(ID) {
        return totalPlayTimes[playerIDs.indexOf(ID)];
    };

    module.getCurrentPlayer = function() {
        return getCurrentPlayer();
    };

    module.getCurrentPlayerID = function() {
        return currentPlayerID;
    };

    module.getCurrentPlayerState = function() {
        return currentPlayerState;
    };
    module.getPlayerFromID = function(ID) {
        return $('#' + ID).data().videoPlayerState.videoPlayer;
    };

    module.getPlayerDataStateFromID = function(ID) {
      if ($('#' + ID).data()) {
        return $('#' + ID).data().videoPlayerState;
      }
    };

    module.playVideo = function() {
        if (currentPlayerState !== 'play') {
            getCurrentPlayer().play();
            currentPlayerState = 'play';
        }
    };

    module.pauseVideo = function() {
        if (currentPlayerState !== 'pause') {
            getCurrentPlayer().pause();
            currentPlayerState = 'pause';
        }
    };

    module.toggleCurrentPlayer = function() {
        if (currentPlayerState !== 'play') {
        module.playVideo();
        } else {
        module.pauseVideo();
        }
    };

    module.toggleVideoFromID = function(id) {
        currentPlayerID = id;
        module.toggleCurrentPlayer();
    };    

    module.getCurrentTime = function() {
        return getCurrentPlayer().currentTime;
    };

    module.getDuration = function() {
        return getCurrentPlayer().duration();
    };

    module.rewindAndPlay = function(secToRewind) {
        console.log(">>>REWIND(): CURRENT VIDEO STATE = " + currentPlayerState);

        if (currentPlayerState === 'play') {
            return;
        }

        var secondsPlayed = getCurrentPlayer().currentTime;
        var totalDuration = getCurrentPlayer().duration();
        var restartVideoAt;
        if (secondsPlayed > secToRewind) {
            restartVideoAt = secondsPlayed - secToRewind;
        } else {
             restartVideoAt = secondsPlayed;
        }

        if (currentPlayerState === 'pause') {
            console.log('DUR= ' + totalDuration + ' Played= ' + secondsPlayed + 'FRewind to ' + restartVideoAt);
            getCurrentPlayer().seekTo(restartVideoAt); // had true as 2nd arg but seekTo here takes only 1
            getCurrentPlayer().play();
            currentPlayerState = 'play';
        }
    };

    module.updateOverlay = function() {
        $.each(playerIDs, function(i, v) {
        var ID = v;
        var overlayid = 'overlay_'+ID;
        if ($('#' + overlayid).length > 0) {
            var w = $('#'+ID).outerWidth();
            var h =$('#'+ID).outerHeight();
            $('#' + overlayid).css('width', '100%');
            $('#' + overlayid).css('heigth', '100%');
        } else if ($('#' + overlayid).length === 0) {
            if (module.getPlayerDataStateFromID(ID) && module.getPlayerDataStateFromID(ID).isYoutubeType()) {
            var wrapper = $('#' + ID).closest('div').find('.video-wrapper');
            var vIframe = $('#' + ID).find('iframe');
            var overlay = $('<div class="video_overlay" id='+overlayid+'></div>');
            overlay.click(() => {
                module.toggleVideoFromID(ID);
            });        
            var w = $('#'+ID).outerWidth();
            var h =$('#'+ID).outerHeight();
            $('#' + overlayid).css('width', '100%');
            $('#' + overlayid).css('heigth', '100%');
            wrapper.prepend(overlay);        
            }
        }
        });
        $('.video-controls').css('z-index', 100);
    };    

    return module;
})();
