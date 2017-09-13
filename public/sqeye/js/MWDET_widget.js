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
      // if (window.length < 25) {
      //   mwdet_logger.logException({
      //     'videoID': vcontrol.getCurrentPlayerID(),
      //     'exceptionType': 2,
      //     'exceptionDescription': 'low/no gaze data',
      //     'videoTime': vcontrol.getCurrentTime(),
      //     'videoDuration': vcontrol.getDuration(),
      //   });
      //   return;
      // }

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
   * Places an alert on page
   * @param {String} title Title of alert
   * @param {HTMLstring} content Content of alert
   * @param {HTMLinputs} inputs 
   */
  function placeAlert(title, content, inputs) {
    $('#msgH1').empty();
    $('#msgContent').empty();
    $('#msgInputs').empty();

    $('#msgH1').append(title);
    $('#msgContent').append(content);

    $.each(inputs, function(i, o) {
      $('#msgInputs').append(o);
    });

    $('#msgOverlay').css('display', 'flex');
  }

  /**
   * Hides the alert
   */
  function hideAlert() {
    $('#msgOverlay').hide();
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
    mwdet_intro();
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
        $(this).text('Click to show menu');
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
      if (localStorage.getItem('webgazerGlobalData') === null || windowSizeIsChanged()) {
        $('.MWDET-setup').css('display', 'flex');
        prechecker.webcamState();
        Gazer.startWebgazer();
        Gazer.initFacecheck(facecheckComplete);
      } else {
        enableFeedbackProcedure();
      }
    }

    vcontrol.init(function(status) {
      updateIndicator(status);
      switch (status) {
        case 'play':
          // Rating.enable();
          if (mwdetIsEnabled()) {
            Gazer.resumeWebgazer();
            widgetStatus = (widgetStatus === 'end') ? 'start':'resume';
            console.log('[MWDET] webgazer resumed.');
          }
          break;
        case 'seek':
        case 'pause':
          // Rating.pause();
          if (mwdetIsEnabled()) {
            Gazer.pauseWebgazer();
            widgetStatus = 'pause';
            console.log('[MWDET] webgazer paused.');
          }
          break;
        case 'ended':
          if (mwdetIsEnabled()) {
            Gazer.stopWebgazer();
            widgetStatus = 'end';
          }
        default: // nothing.
      }
    });

    if (vcontrol.getPlayerIDs().length === 0) {
      return;
    }

    updateIndicator();
    mwdet_logger.init();
    logWidgetStatus(widgetStatus);
  };

  module.showIntroMessage = function() {
    showIntroMessage();
  };

  module.hideAlert = function() {
    hideAlert();
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
      if (localStorage.getItem('webgazerGlobalData') === null || windowSizeIsChanged()) {
        $('.MWDET-setup').css('display', 'flex');
        prechecker.webcamState();
        Gazer.startWebgazer();
        Gazer.initFacecheck(facecheckComplete);
      } else {
        enableFeedbackProcedure();
      }

      logWidgetStatus('allow');
    } else {
      Gazer.stopWebgazer();
      if (askAgain) {
        logWidgetStatus('skip');
      } else {
        logWidgetStatus('disallow');
      }
    }

    updateIndicator();
    hideAlert();
  };

  module.placeAlert = function(title, content, inputs) {
    placeAlert(title, content, inputs);
  };

  module.toggleWidget = function() {
    vcontrol.pauseVideo();
    if($('#switchUseWidget').is(':checked')) {
      module.handleUsersChoice(true, true);
    } else {
      module.handleUsersChoice(false, true);
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

  module.isReady = function() {
    return isReady;
  };

  return module;
})();

window.prechecker = window.prechecker || (function() {
  /**
   * @return {bool} true if webcam is available;
   */
  function webcamIsAvailable() {
      navigator.getUserMedia=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia||navigator.msGetUserMedia;
      if (navigator.getUserMedia) {
          return true;
      } else {
          return false;
      }
  }

  /**
   * Places an alert if the webcam is denied by user.
   */
  function checkWebcamState() {
      navigator.getUserMedia=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia||navigator.msGetUserMedia;
      if (navigator.getUserMedia) {
          navigator.getUserMedia( {
              video: true,
          },
          // Success Callback
          function(stream) {
              stream.getVideoTracks()[0].stop();
          },
          // Error Callback
          function(err) {
              if (err.name === 'PermissionDeniedError') {
                mwdet.placeAlert('Webcam permission', 'You need to grant permission to the webcam and refresh the page for the widget to work.', 
              []
              );
              }
          });
      }
  }        

  /**
   * @return {*} 
   */
  function getEnvironment() {
      // detect operating system.
      var OS = 'unknown';
      var browser = 'unkown';
      var version = 'unknown';
      var mobile = false;
      
      if (/Mobi/i.test(navigator.userAgent) || /Android/i.test(navigator.userAgent)) {
          mobile = true;
      }

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
          'mobile': mobile,
          'screenHeigth': screen.height,
          'screenWidth': screen.width,
      };
  }

  return {
      getEnvironment: function() {
          return getEnvironment();
      },

      webcamIsAvailable: function() {
          return webcamIsAvailable();
      },

      webcamState: function() {
          return checkWebcamState();
      },
  };
}) ();


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

var edxCheck;
var logCheck;
$(document).ready(function() {
  if (window.location.href.indexOf('studio') > 0) {
      $('.mwdet-main').hide();
  } else {
    edxCheck = setInterval(function() {
      if (analytics && analytics.user) {
          clearInterval(edxCheck);

          var desktop = (prechecker.getEnvironment().mobile == false);
          var webcam = prechecker.webcamIsAvailable();
          
          if (desktop && webcam) {   
              setTimeout(function() {
                  if (parseInt(analytics.user().id()) % 2 === 0) {
                      mwdet.init();

                      logCheck = setInterval(function() {
                        if (mwdet_logger.isReady()) {
                          clearInterval(logCheck);
                          if (!desktop) {
                            mwdet_logger.logBannedUser('Mobile');                       }                      
                          if (!webcam) {
                            mwdet_logger.logBannedUser('No webcam');
                          }                          
                        }
                      }, 200);
                  } else {
                      alert('tarmo\'s widget');
                  }
              }, 0);
          } else {
            mwdet.hideAlert();
          }
      }
    }, 100);
  }
});
