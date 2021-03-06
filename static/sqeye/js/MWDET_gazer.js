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
    
    $('#fc_infobox').empty();
    $('#fc_infobox').append(`
    <p style="margin:0">Try to position yourself in such a way that the overlay fits your face sufficiently. 
    Please make sure that your eyes are correctly fitted.</p>
    <p style="margin:0">If you cannot see your face or you are not able to get your face or eyes tracked sufficiently, 
    please refresh this page and disable the widget.</p>
    `);
    $('#fc_infobox').append(
      `
      <div>
        <div class='mw_tooltip'>
        <button id='fc_disable' class='edx-button-faded mw_tooltip' style='margin-top: 10px;' onclick='Gazer.closeFacecheckAndRefresh();'>Refresh this page</button>
        <span class='mw_tooltiptext'>I cannot see my face or I am unable to get my face or eyes tracked sufficiently.</span>
        </div>      
        <div class='mw_tooltip'>
        <button id='fc_cont' class='edx-button mw_tooltip' style='margin-top: 10px;' onclick='Gazer.closeFacecheckContinue()'>Continue</button>
        <span class='mw_tooltiptext'>I can see that my face and eyes are tracked sufficiently.</span>
        </div>
      </div>
    `);    

    var width = 480;
    var height = 360;
    var topDist = ($(document).height() - height) / 2 + 'px';
    var leftDist = ($(document).width() - width) / 2 + 'px';

    var setup = function () {
      var video = document.getElementById('webgazerVideoFeed');
      video.style.display = 'block';
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
      overlay.style.margin = '0px';
   

      $(".overlay").append(overlay);
      $('.facecheckContainer').prepend($('#overlay'));
      $('.facecheckContainer').prepend($('#webgazerVideoFeed'));
      $('.facecheckContainer').prepend($('#webgazerVideoCanvas'));

      var cl = webgazer.getTracker().clm;

      function drawLoop() {
        requestAnimFrame(drawLoop);
        overlay.getContext('2d').clearRect(0, 0, width, height);
        if (cl.getCurrentPosition()) {
          cl.draw(overlay);
        }
      }
      drawLoop();
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

  function closeFacecheckAndRefresh() {
    mwdet.handleUsersChoice(false, true);
    window.location.href=document.URL;
  }

  function closeFacecheckContinue() {
    $('.overlay').hide();
    onFinishFacecheck();    
  }

  function setOnFinishFacecheck(callback) {
    onFinishFacecheck = callback;
  }

  function startWebgazer() {
    if (gazerIsStarted)
      return;
    gazerIsStarted = true;
    gazerIsPaused = false;
    Gazerdata.startPolling();
    window.webgazer = webgazer;
    webgazer.setRegression('ridge') /* currently must set regression and tracker */
      .setTracker('clmtrackr')
      .setGazeListener(function (data, clock) {
      })
      .begin();
    webgazer.showPredictionPoints(false); /* shows a square every 100 milliseconds where current prediction is */
  }

  function stopWebgazer() {
    Gazerdata.stopPolling();
    if (gazerIsStarted) {
      try {
        webgazer.end();
      } catch (e) {
        console.log(e);
        localStorage.removeItem('webgazerGlobalData');
        console.log("Store failed");
      }      
    }
    gazerIsStarted = false;
    gazerIsPaused = false;
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

  module.closeFacecheckAndRefresh = function () {
    closeFacecheckAndRefresh();
  };

  module.closeFacecheckContinue = function() {
    closeFacecheckContinue();
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