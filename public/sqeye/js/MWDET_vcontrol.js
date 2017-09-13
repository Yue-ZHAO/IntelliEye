// =============================================================================
// 
// =============================================================================
// *Video status
// =============================================================================
// 
// =============================================================================
/**
 * 13-05-2017
 * This module contains functions that watch and reports
 * status changes of a Youtube video on an EDX page.
 */

window.vcontrol = window.vcontrol || (function() {
  // =============================================================================
  // private
  // =============================================================================

  var module = {};

  var isReady = false;

  // contains video states
  var playerIDs = [];
  var currentPlayerID = '';
  var currentPlayerStatus;

  var callOnStatusChange;

  // coordinates of the four corners of the video player.
  var coordinates = {
    'topLeft': {
      x: 0,
      y: 0,
    },
    'topRight': {
      x: 0,
      y: 0,
    },
    'bottomLeft': {
      x: 0,
      y: 0,
    },
    'bottomRight': {
      x: 0,
      y: 0,
    },
  };

  /**
   * initializes module. Loads Youtube code.
   * @param {function} callback function to call when video status changes.
   */
  function init(callback) {
    callOnStatusChange = callback;

      // collect all video IDs.
      $.each($('.video'), function(i, v) {
        console.log('video id:' + v.getAttribute('id'));
        playerIDs[i] = v.getAttribute('id');
        
        var overlayid = 'overlay_'+v.getAttribute('id');
        if (module.getPlayerDataStateFromID(v.getAttribute('id')).isYoutubeType() && $('#' + overlayid).length === 0) {
          var wrapper = $('#' + v.getAttribute('id')).closest('div').find('.video-wrapper');
          var vIframe = $('#' + v.getAttribute('id')).find('iframe');
          var overlay = $('<div class="video_overlay" id='+overlayid+'></div>');
          overlay.click(() => {
            module.toggleVideoFromID(v.getAttribute('id'));
          });
          var vplayer = $('#' + v.getAttribute('id')).closest('div').find('.video-player');
          overlay.css('width', '100%');
          overlay.css('height', '100%');
          wrapper.prepend(overlay);
        }
      });

      // if no videos are found
      if (playerIDs.length === 0) {
        return;
      }

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
          setTimeout(() => { callOnStatusChange('play'); }, 1000);
        }

        // TODO: check if this is needed
        callOnStatusChange('play');

        // onStateChange() is used by edX so this is 
        // a less neat but faster than an interval version of that:
        // external function callOnStatusChange is set when initialized above (by controller).
        /* eslint-disable*/
        $('#' + currentPlayerID).on('play', () => { currentPlayerStatus = 'play'; callOnStatusChange('play'); });
        $('#' + currentPlayerID).on('pause', () => { currentPlayerStatus = 'pause'; callOnStatusChange('pause'); });
        $('#' + currentPlayerID).on('seek', () => { currentPlayerStatus = 'seek'; callOnStatusChange('seek'); });
        $('#' + currentPlayerID).on('ended', () => { currentPlayerStatus = 'ended'; callOnStatusChange('ended'); });
        /*eslint-disable*/
      });

      // initialize and update video corners coordinates.
      updateCoordinates();
      $(window).scroll(function() {
        updateCoordinates(false);
      });

      $('.add-fullscreen').click(function() {
        updateCoordinates();
      });

      $(document).keypress(function(e) {
        if (e.which == 27) {
          updateCoordinates();
        }
      });

      isReady = true;

  }

  /**
   * Updates coordinates of the 4 corners of the video player.
   */
  function updateCoordinates() {
    if ($('.add-fullscreen').attr('title') !== 'Fill browser') {
      coordinates.topLeft = {
        x: 0,
        y: 0,
      };
      coordinates.topRight = {
        x: $(window).width(),
        y: 0,
      };
      coordinates.bottomLeft = {
        x: 0,
        y: $(window).height(),
      };
      coordinates.bottomRight = {
        x: $(window).width(),
        y: $(window).height(),
      };
      return;
    }

    // space outside course-wrapper:
    var hspace = ($('body').width() - $('.course-wrapper').width()) / 2;
    var vspace = $('.course-material').outerHeight()
      + $('.preview-menu').outerHeight()
      + $('#global-navigation').outerHeight();

    var tc = $('.tc-wrapper');
    var left = tc.position().left + hspace;
    var top = tc.position().top + vspace - $(window).scrollTop();
    var width = tc.outerWidth();
    var height = tc.outerHeight();

    coordinates.topLeft.x = left;
    coordinates.topLeft.y = top;

    coordinates.topRight.x = coordinates.topLeft.x + width;
    coordinates.topRight.y = top;

    coordinates.bottomLeft.x = coordinates.topLeft.x;
    coordinates.bottomLeft.y = coordinates.topLeft.y + height;

    coordinates.bottomRight.x = coordinates.topRight.x;
    coordinates.bottomRight.y = coordinates.topRight.y + height;
  }

  /**
   * @return {*} the current video player
   */
  function getCurrentPlayer() {
    if (currentPlayerID.length > 0)
      return $('#' + currentPlayerID).data().videoPlayerState.videoPlayer;
  }

  // =========================================================================
  // public
  // =========================================================================

  module.init = function(callback) {
    init(callback);
    console.log('[MWDET] VideoStatus initialized.');
  };

  module.isReady = function() {
    return isReady;
  }

  module.getPlayer = function() {
    return getCurrentPlayer();
  };

  module.playVideo = function() {
    currentPlayerStatus = 'play';
    getCurrentPlayer().play();
  };

  module.pauseVideo = function() {
    currentPlayerStatus = 'pause';
    getCurrentPlayer().pause();
  };

  module.toggleCurrentPlayer = function() {
    if (currentPlayerStatus !== 'play') {
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

  module.getCurrentPlayer = function() {
      return getCurrentPlayer();
  };

  module.getCurrentPlayerID = function() {
      return currentPlayerID;
  };

  module.getCurrentPlayerStatus = function() {
      return currentPlayerStatus;
  };
  module.getPlayerFromID = function(ID) {
      return $('#' + ID).data().videoPlayerState.videoPlayer;
  };

  module.getPlayerDataStateFromID = function(ID) {
      if ($('#' + ID).data()) {
        return $('#' + ID).data().videoPlayerState;
      }
  };  


  module.getPlayerIDs = function() {
    return playerIDs;
  };

  module.getCurrentPlayerID = function() {
    return currentPlayerID;
  };

  /**
   * Returns the coordinates of the 4 corners of the video.
   * @return {Object} the video's coordinates
   */
  module.getCoordinates = function() {
    return coordinates;
  };

  module.updateOverlay = function() {
    $.each(playerIDs, function(i, v) {
      var ID = v;
      var overlayid = 'overlay_'+ID;
      if ($('#' + overlayid).length > 0) {
        var w = $('#'+ID).outerWidth();
        var h =$('#'+ID).outerHeight()
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
          var h =$('#'+ID).outerHeight()
          $('#' + overlayid).css('width', '100%');
          $('#' + overlayid).css('heigth', '100%');
          wrapper.prepend(overlay);        
        }
      }
    });
    $('.video-controls').css('z-index', 100);
  }

  return module;
})();