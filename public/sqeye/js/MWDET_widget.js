// =============================================================================
// 
// =============================================================================
// Main *widget control
// =============================================================================
// 
// =============================================================================
var MWDET_VERSION = '01';

window.mwdet = window.mwdet || (function() {
  var isReady = true;

  var audioloop;

  var module = {};

  // var RTP = require('RTP');

  var widgetStatus = 'end';

  /**
   * Callback function.
   * when facechecking is complete, 
   * run calibration code.
   */
  var facecheckComplete = function() {
    webgazer.showPredictionPoints(false);

    // store window width and height as calibration is relative to that.
    var w = window.innerWidth;
    var h = window.innerHeight;
    // eslint-disable-next-line
    localStorage.setItem('cal_wsize', JSON.stringify({ 'width': w, 'height': h }));

    // start calibration
    $('#calibrationOverlay').show();
    Calibration.initCalibration(calibrationComplete);
    console.log('[MWDET] Facechecking complete.');
  };

  /**
   * Callback function.
   * when calibration is complete,
   * run feedback procedure.
   */
  var calibrationComplete = function() {
    webgazer.pause();
    $('#calibrationOverlay').hide();
    enableFeedbackProcedure();
    $('.MWDET-overlay').fadeOut();
    console.log('[MWDET] Calibration complete.');
    webgazer.showPredictionPoints(false);
  };

  /**
   * Returns whether window size has changed since previous calibration
   * @return {boolean} True if the window size has been changed. Else false.
   */
  function windowSizeIsChanged() {
    if (localStorage.getItem('cal_wsize') === null) {
      return true;
    }

    var w = window.innerWidth;
    var h = window.innerHeight;

    var storedSize = JSON.parse(localStorage.getItem('cal_wsize'));

    if (parseInt(storedSize.width) !== w || parseInt(storedSize.height) !== h) {
      return true;
    }

    return false;
  }

  // ===========================================================================
  // MAIN FEEDBACK PROCEDURE
  // ===========================================================================
  /**
   * Determines what happens with the user's gaze.
   */
  function enableFeedbackProcedure() {
    Gazerdata.init(function(window) {
      // window with fixed frequency
      console.log('window size: ' + window.length);

      var prediction = NBayes.predictFromWindow(window);
      console.log('>> prediction: ' + prediction);
      if (parseInt(prediction) === 1) {
        if (MWDET_AUDITORY_ALERT) {
          audioAlert();
        }

        if (MWDET_VISUAL_ALERT) {
          visualAlert();
        }

        if (mwdet_logger.isReady()) {
          mwdet_logger.logPrediction({
            'prediction': 1,
            'time': Date.now(),
            'videoID': vcontrol.getCurrentPlayerID(),
            'videoTime': vcontrol.getCurrentTime(),
            'videoDuration': vcontrol.getDuration(),
          });
        }
      }
    });
  }

  /**
   * Check if the widget is enabled by user.
   * @return {boolean} True if widget is enabled else false
   */
  function mwdetIsEnabled() {
    return (localStorage.mwdet_enabled == 'true' || sessionStorage.mwdet_enabled == 'true');
  }

  /**
   * Turns the introduction message visible.
   */
  function showIntroMessage() {
    moocwidget.UI.mwdet_intro();
  }

  /**
   * Update Squirrel Eye indicator based on status
   * @param {*} status 
   */
  function updateIndicator(status) {
    // if no indicator is added yet, add one
    // remove all other indicators
    $.each(vcontrol.getPlayerIDs(), function(i, pID) {
      // parent
      var par = $('#' + pID.split('video_')[1]).parent();

      if (pID !== vcontrol.getCurrentPlayerID() && par.find('#indicatorContainer').length > 0) {
        par.find('#indicatorContainer').remove();
      }
    });

    var par = $('#' + vcontrol.getCurrentPlayerID().split('video_')[1]).parent();
    if (par.find('#indicatorContainer').length === 0) {
      var indicator = $('<div id="indicatorContainer"></div>');
      indicator.append('<label class="widgetSwitch" onclick="mwdet.toggleWidget()"><input id="switchUseWidget" type="checkbox"><span class="widgetSlider"></span></label>');
      indicator.append('<div id="iEyeIndicator" class="indicator" onclick="vcontrol.pauseVideo();mwdet.showIntroMessage()"></div>');
      par.prepend(indicator);

      /* eslint-disable */
      $('#iEyeIndicator').hover(function() {
        currentIndicator = $(this).text();
        $(this).text('Show menu');
      }, function() {
        $(this).text(currentIndicator);
      });
      /* eslint-enable */
    }

    if (mwdetIsEnabled()) {
      $('#iEyeIndicator').removeClass('indicatorOff').addClass('indicator');
      $('#switchUseWidget').prop('checked', true);
      // update tooltip
      switch (status) {
        case 'play':
          $('#iEyeIndicator').text('Playing');
          break;
        case 'pause':
          $('#iEyeIndicator').text('Paused');
          break;
        case 'ended':
          $('#iEyeIndicator').text('Not Active');
          break;
        default: $('#iEyeIndicator').text('Active');
      }
    } else {
      $('#iEyeIndicator').removeClass('indicator').addClass('indicatorOff');
      $('#iEyeIndicator').text('Not Active');
      $('#switchUseWidget').prop('checked', false);
    }
  }

  // ===========================================================================
  // Alerts
  // ===========================================================================
  /**
   * Gives an audio alert
   */
  function audioAlert() {
    var audio = new Audio('http://k003.kiwi6.com/hotlink/w6xeu1du1q/alert.mp3');
    audio.play();
  }

  /**
   * Checks if the player is in fullscreen mode or not.
   * In fullscreen mode, an inset box shadow style class is applied.
   */
  function visualAlert() {
    // currently not in fullscreen mode
    if ($('.add-fullscreen').attr('title') === 'Fill browser') {
      $('#' + vcontrol.getCurrentPlayerID()).closest('div').find('.tc-wrapper').addClass('blink');
    } else {
      // fullscreen mode
      $('#' + vcontrol.getCurrentPlayerID()).closest('div').find('.tc-wrapper').addClass('blink-fs');
    }

    setTimeout(function() {
      removeVisualAlert();
    }, 6500);
  }

  /**
   * Removes the visual alert of the video player.
   */
  function removeVisualAlert() {
    if ($('.tc-wrapper').hasClass('blink-fs')) {
      $('.tc-wrapper').removeClass('blink-fs');
    } else if ($('.tc-wrapper').hasClass('blink')) {
      $('.tc-wrapper').removeClass('blink');
    }
  }

  /**
   * loops audio alert when focus out
   */
  function audioAlertLoop() {
    clearInterval(audioloop);
    audioloop = setInterval(function() {
      audioAlert();
    }, 5000);
  }

  /**
   * stops audio alert loop
   */
  function stopAudioAlertLoop() {
    clearInterval(audioloop);
    audioloop = null;
  }

  /**
   * loops visual alert when focus out
   */
  function visualAlertLoop() {
    // currently not in fullscreen mode
    if ($('.add-fullscreen').attr('title') === 'Fill browser') {
      $('#' + vcontrol.getCurrentPlayerID()).closest('div').find('.tc-wrapper').addClass('blink');
    } else {
      // fullscreen mode
      $('#' + vcontrol.getCurrentPlayerID()).closest('div').find('.tc-wrapper').addClass('blink-fs');
    }
  }

  /**
   * stops visual alert loop
   */
  function stopVisualAlertLoop() {
    removeVisualAlert();
  }

  /**
   * Logs the status of the widget
   * @param {*} status status of widget
   */
  function logWidgetStatus(status) {
    if (!vcontrol.isReady() || !vcontrol.getPlayer()) {
      return;
    }

    // eslint-disable-next-line
    function findStatusCode(s) {
      var wstatus = ['', 'allow', 'skip', 'start', 'pause', 'resume', 'end', 'disallow'];
      return wstatus.indexOf(s) > -1 ? wstatus.indexOf(s) : 'unknown';
    }

    var data = {
      'videoID': vcontrol.getCurrentPlayerID(),
      'time': Date.now(),
      'videoTime': vcontrol.getCurrentTime(),
      'videoDuration': vcontrol.getDuration(),
      'eventType': findStatusCode(status),
      'eventDescription': status,
    };

    mwdet_logger.logWidgetStatus(data);
  }

  // ===========================================================================
  // public
  // ===========================================================================

  // public
  module.init = function() {
    // fit container to page
    var body = document.body,
      html = document.documentElement;

    var height = Math.max(body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight);
    $('.mwdet-main').css('height', height);
    $('.mwdet-main').css('width', $('body').width());
    $('.main-container').prepend($('.mwdet-main'));

    // place introduction box
    if (!localStorage.mwdet_enabled) {
      showIntroMessage();
    } else if (localStorage.getItem('mwdet_enabled') == 'true') {
      module.startWidget();
    }

    vcontrol.init(function(status) {
      updateIndicator(status);
      switch (status) {
        case 'play':
          // Rating.enable();
          if (mwdetIsEnabled()) {
            if (widgetStatus === 'pause') {
              module.resumeWidget();
            } else {
              module.startWidget();
            }
          }          
          break;
        case 'seek':
        case 'pause':
          // Rating.pause();
          if (mwdetIsEnabled()) {
            module.pauseWidget();          
          }

          break;
        case 'ended':
        if (mwdetIsEnabled) {
          module.stopWidget();        
        }

        default: // nothing.
      }
    });

    if (vcontrol.getPlayerIDs().length === 0) {
      return;
    }

    updateIndicator();
    mwdet_logger.init();
  };

  module.showIntroMessage = function() {
    showIntroMessage();
  };

  /**
   * handles the user's choice whether to use the widget.
   * @param {bool} userAccepts whether the user chooses to use widget.
   * @param {bool} fromSwitch whether the choice was made through the switch or the menu.
   */
  module.handleUsersChoice = function(userAccepts, fromSwitch=false) {
    var askAgain;
    askAgain = fromSwitch || $('#intro_askAgain').is(':checked');

    sessionStorage.mwdet_enabled = userAccepts;
    localStorage.mwdet_enabled = userAccepts;

    if (askAgain) {
      localStorage.removeItem('mwdet_enabled');
    }

    if (userAccepts) {
      // show setup overlay
      $('#switchUseWidget').prop('checked', true);
      module.startWidget();
      logWidgetStatus('allow');
    } else {
      $('#switchUseWidget').prop('checked', false);
      module.stopWidget();
      if (askAgain) {
        logWidgetStatus('skip');
      } else {
        logWidgetStatus('disallow');
      }
    }

    updateIndicator();
  };

  module.toggleWidget = function() {
    vcontrol.pauseVideo();
    if ($('#switchUseWidget').is(':checked')) {
      module.handleUsersChoice(false, true);
    } else {
      module.handleUsersChoice(true, true);
    }
  };

  module.showIntroMessage = function() {
    showIntroMessage();
  };

  module.updateIndicator = function() {
    updateIndicator();
  };

  module.audioAlertLoop = function() {
    audioAlertLoop();
  };

  module.stopAudioAlertLoop = function() {
    stopAudioAlertLoop();
  };

  module.visualAlertLoop = function() {
    visualAlertLoop();
  };

  module.stopVisualAlertLoop = function() {
    stopVisualAlertLoop();
  };

  module.startWidget = function() {
    Gazer.startWebgazer();
    if (localStorage.getItem('webgazerGlobalData') === null || windowSizeIsChanged()) {
      $('.MWDET-setup').css('display', 'flex');
      moocwidget.envChecker.webcamState();
      Gazer.initFacecheck(facecheckComplete);
    } else {
      enableFeedbackProcedure();
    }    
    console.log('[Sqeye] Starting widget.');
    widgetStatus = 'start';
    logWidgetStatus(widgetStatus);
  };

  module.stopWidget = function() {
    Gazer.stopWebgazer();
    widgetStatus = 'end';
    logWidgetStatus(widgetStatus);    
    console.log('[Sqeye] Stopping widget.');
  };

  module.pauseWidget = function() {
    Gazer.pauseWebgazer();
    widgetStatus = 'pause';
    logWidgetStatus(widgetStatus);    
    console.log('[Sqeye] Pausing widget.');
  };

  module.resumeWidget = function() {
    Gazer.resumeWebgazer();
    widgetStatus = 'resume';
    logWidgetStatus(widgetStatus);    
    console.log('[Sqeye] Resuming widget.');
  };

  module.isReady = function() {
    return isReady;
  };

  return module;
})();

/**
 * For debugging purposes
 * @param {*} title title of log
 * @param {*} text content log
 * @param {*} wd window object
 * @return {*} window object
 */
function logInTab(title, text, wd) {
  var newwindow = typeof wd === 'undefined' ? window.open() : wd;
  var body = $(newwindow.document.body);
  if ($.isArray(text)) {
    body.append('<h2>(' + text.length + ')' + title + '</h2><br>' + JSON.stringify(text) + '<hr>');
  } else {
    body.append('<h2>' + title + '</h2><br>' + text + '<hr>');
  }
  return newwindow;
}
