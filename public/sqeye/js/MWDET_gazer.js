// =============================================================================
// 
// =============================================================================
// *GAZER 
// =============================================================================
// 
// =============================================================================
/*eslint-disable*/
/**
 * 13-05-2017
 * Gazer manages all functions related to eyetracking.
 * Uses the eyetracker module.
 */
window.Gazer = window.Gazer || (function () {
  var module = {};

  var gazerIsStarted = false;
  var gazerIsPaused = false;

  var onFinishFacecheck;
  // =========================================================================
  // private
  // =========================================================================
  function initFacecheck() {
    // window.localStorage.clear();

    var width = 360;
    var height = 360;
    var topDist = ($(document).height() - height) / 2 + 'px';
    var leftDist = ($(document).width() - width) / 2 + 'px';

    var setup = function () {
      var video = document.getElementById('webgazerVideoFeed');
      video.style.display = 'block';
      // video.style.position = 'absolute';
      // video.style.top = topDist;
      // video.style.left = leftDist;
      video.style.zIndex = 2;
      video.width = width;
      video.height = height;
      video.style.margin = '0px';

      webgazer.params.imgWidth = width;
      webgazer.params.imgHeight = height;

      var overlay = document.createElement('canvas');
      overlay.id = 'overlay';
      overlay.style.position = 'absolute';
      overlay.width = width;
      overlay.height = height;
      overlay.style.zIndex = 3;
      // overlay.style.top = topDist;
      // overlay.style.left = leftDist;
      overlay.style.margin = '0px';

      $(".overlay").append(overlay);
      $('.facecheckContainer').prepend($('#overlay'));
      $('.facecheckContainer').prepend($('#webgazerVideoFeed'));
      $('.facecheckContainer').prepend($('#webgazerVideoCanvas'));

      $('#fc_infobox').append("Try to position yourself in such a way that the overlay fits your face perfectly.");
      $('#fc_infobox').append("<button class='btn btn-primary' style='margin-top: 10px;' onclick='Gazer.closeFacecheck()'>Continue</button>");

      var cl = webgazer.getTracker().clm;

      function drawLoop() {
        requestAnimFrame(drawLoop);
        overlay.getContext('2d').clearRect(0, 0, width, height);
        if (cl.getCurrentPosition()) {
          cl.draw(overlay);
        }
      }
      drawLoop();

      // $('#infobox').show();
      // $('#infobox').css('top', parseInt(height + (($(document).height() - height) / 2) + 25) + 'px');
    };

    function checkIfReady() {
      if (webgazer.isReady()) {
        setup();
      } else {
        setTimeout(checkIfReady, 100);
      }
    }
    setTimeout(checkIfReady, 100);

    window.onbeforeunload = function () {
      webgazer.end();
    };

  }

  function closeFacecheck() {
    // webgazer.end(); // something's not right here.
    $(".facecheckContainer").remove();
    $("#infobox").empty();
    $(".overlay").hide();
    onFinishFacecheck();
  }

  function setOnFinishFacecheck(callback) {
    onFinishFacecheck = callback;
  }

  function startWebgazer() {
    if (gazerIsStarted)
      return;
    gazerIsStarted = true;
    window.webgazer = webgazer;
    webgazer.setRegression('ridge') /* currently must set regression and tracker */
      .setTracker('clmtrackr')
      .setGazeListener(function (data, clock) {
        //   console.log(data); /* data is an object containing an x and y key which are the x and y prediction coordinates (no bounds limiting) */
        //   console.log(clock); /* elapsed time in milliseconds since webgazer.begin() was called */
      })
      .begin();
    webgazer.showPredictionPoints(false); /* shows a square every 100 milliseconds where current prediction is */
  }

  function stopWebgazer() {
    Gazerdata.stopPolling();
    // TODO: shut down cam
    // if (localstream) {
    //   localstream.getTracks()[0].stop();
    // }
    if (gazerIsStarted) {
      try {
        webgazer.end();
      } catch (e) {
        console.log(e);
        localStorage.removeItem('webgazerGlobalData');
        console.log("Store failed");
      }      
    }
  }

  function pauseGazer() {
    webgazer.pause();
    Gazerdata.stopPolling();
    gazerIsPaused = true;
  }

  function resumeGazer() {
    if (!gazerIsStarted) {
      startWebgazer();
    } else {
      webgazer.resume();
    }
    
    Gazerdata.startPolling();
    gazerIsPaused = false;
  }  

  // =========================================================================
  // public
  // =========================================================================
  module.initFacecheck = function (callback) {
    startWebgazer();
    initFacecheck();
    setOnFinishFacecheck(callback);
  };

  module.closeFacecheck = function () {
    closeFacecheck();
  };

  module.startWebgazer = function () {
    startWebgazer();
  };

  module.stopWebgazer = function () {
    stopWebgazer();
  };

  module.pauseWebgazer = function() {
    pauseGazer();
  };

  module.resumeWebgazer = function() {
    resumeGazer();
  };

  module.gazerIsPaused = function () {
    return gazerIsPaused;
  };
  
  return module;
})();