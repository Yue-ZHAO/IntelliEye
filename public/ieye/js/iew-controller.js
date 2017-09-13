/*eslint-disable*/
var IEYEVERSION = '01';

window.IEyeController = window.IEyeController || (function() {
    var module = {}; // store public functions here
    var widgetStatus = 'end';
    // =========================================================================
    // Private 
    // =========================================================================

    function _initIntro() {
        $('body').append(`
            <div id='overlay'>
                <div id="overlay-container">
                    <div id='ol-box'>
                        <div id='ol-box-heading'>
                            <div id="hd-img"></div>
                            <h1 class="customh1" >Welcome to IntelliEye</h1>
                            <br>
                        </div>
                        <div id='ol-box-content'>
                            <p>This unit is equipped with Intellieye, a widget developed at TU Delft. IntelliEye will help you during watching MOOC
                                videos. Whenever you lose focus watching the video playing, Intellieye will detect it and pause the video for you.
                                Once you are focusing on the video again, the video will be rewinded a few seconds to a familiar section for you and
                                resumed. Intellieye is an automated <b>privacy-aware</b> assistant for you on the edX platform. 
                            </p>
                            <div id="intro-howto-cont">
                            <div>
                            <p>
                            To use IntelliEye:
                                <ul>
                                    <li>just simply allow your webcam when you are asked to</li>
                                    <li>face the camera and watch the video as you normally do</li>
                                </ul>                      
                            </p>
                        </div>
                            <img src="https://moocwidgets.cc/static/ieye/img/ieye_instructions.png" width="350px">
                            </div>
                    <span class='lm' id='lm1'><h2 class='h2-section'>How does it work?<span id='lm1-text'>Learn more</span></h2></span>
                            <p class='ieye_descr' id='lm1-d'>Intellieye uses your computer webcam, with your permission, and looks for a face frame in the camera feed. <br/>Intellieye
                                is <b>privacy aware</b> – no videofeed leaves your computer.
                            <br>
                            <img src="https://moocwidgets.cc/static/ieye/img/ieye_instructions2.png" width="400px" style="margin-top:10px">
                            </p>
                    
                    <span class='lm' id='lm2'><h2 class='h2-section'>What do I need to use Intellieye?<span id='lm2-text'>Learn more</span></h2></span>
                            <p class='ieye_descr' id='lm2-d'>You can use Intellieye with any of the modern web browser, i.e., latest version on Firefox, Opera, Chrome, Safari (11+),
                                and MS Edge. Unfortunately, Internet Explorer is not supported. If you have one of the supported browsers, all you
                                need to use Intellieye is to allow camera access in browser when you are asked for it.</p>
                            <span class='lm' id='lm3'><h2 class='h2-section'>What should I pay attention to?<span id='lm3-text'>Learn more</span></h2></span>
                            <div class='ieye_descr' id='lm3-d'>As Intellieye depends on face detection in the web camera video feed, you should pay attention to the following:
                                <ul>
                                    <li>Enable your webcam once asked</li>
                                    <li>Sit normally facing the camera. External camera should be aligned with the screen you are watching the video on.</li>
                                    <li>Try not to put your hand around your face or between your face and the webcam.</li>
                                    <li>Try not to lean back or forward heavily.</li>
                                    <li>Focus on the video content as you would do in a regular classroom setting.</li>
                                </ul>
                            </div>
                            <div id='ieye_choice'>
                                <div id='start_ieye'>Start using IntelliEye</div>
                                <div id='skip_ieye'>Skip</div>
                                <div id='remember_ieye'> For future:
                                    <input name="r_remember" type="radio" value="yes" id='i_remember' checked><label for='i_remember'>Remember my choice</label>
                                    <input name="r_remember" type="radio" value="no" id='i_dont_remember'><label for='i_dont_remember'>Always ask me</label>
                                </div>
                            </div>
                            <i style="display:block;margin-top:20px">To recall this window, click on the <img src="https://moocwidgets.cc/static/ieye/img/intellieye_logo_edx_h60.png" width="20" height:"20" style="vertical-align:middle"> icon above the video.</i>
                        </div>
                    </div>
                </div>        
        `);
    }

    /**
     * Initialize module
     */
    function init() {
        console.log('initializing controller');
        $(window).scrollTop(0);

        _initIntro();

        // setting up correct layout (sizes)
        $('.main-container').prepend($('#overlay'));
        $('#overlay').css('height', $('body').height() + 'px');
        $('#overlay-container').css('height', $(window).height());

        updateIndicator();

        // Events
        $('.lm').click(function () {
            var eq_id = $(this).attr('id');
            $('#' + eq_id + '-d').toggle();
            var eq_text_id = eq_id + '-text';
            if ($('#' + eq_text_id).text() === 'Learn more') {
                $('#' + eq_text_id).text('Hide');
            } else {
                $('#' + eq_text_id).text('Learn more');
            }
        });

        $('#start_ieye').click(function () {
            setChoice(true);
            $('#overlay').hide();
        });

        $('#skip_ieye').click(function () {
            setChoice(false);
            $('#overlay').hide();
        });

        if (!localStorage.use_ieye)
            $('#overlay').show();
    }

    /**
     * Used to recall the introduction overlay when the indicator is clicked.
     */
    function recallOverlay() {
        $(window).scrollTop(0);
        $('#overlay').css('height', $('body').height() + 'px');
        $('#overlay').show();
        vcontrol.pauseVideo();      
    }    

    // set user's choice of using ieye (true/false)
    function setChoice(widgetIsUsed, fromSwitch=false) {
        vcontrol.pauseVideo();

        var iremember = fromSwitch || $('input#i_remember').is(':checked');

        localStorage.use_ieye = widgetIsUsed;
        sessionStorage.use_ieye = widgetIsUsed;
        $.cookie('use_ieye', widgetIsUsed);        

        if (!iremember) {
            localStorage.removeItem('use_ieye');
        } else {
            IEWLogger.logChoice(widgetIsUsed);
        }

        // when user changes decision when the video is playing
        // stop ieye if they chooses not to use the widget
        // start ieye if they chooses to use the widget
        if (widgetIsUsed) {
            console.log('using vid playing');
            IEWLogger.logWidgetStatus('allow');
            if (sessionStorage.iEyeStarted == 'false') {
                ieyewidget.startiEye();
                sessionStorage.iEyeStarted = true;            
            }
            $('#switchUseWidget').prop('checked', true);
        } else {
            console.log('not using vid playing');
            if (!iremember) {
                IEWLogger.logWidgetStatus('skip');
            } else {
                IEWLogger.logWidgetStatus('disallow');
            }

            if (sessionStorage.iEyeStarted == 'true') {
                ieyewidget.stopiEye();
                sessionStorage.iEyeStarted = false;            
            }            
            $('#switchUseWidget').prop('checked', false);
        }

        updateIndicator();
    }

    // reads stored values to determine if we can use ieye.
    function useIEye() {
        return (localStorage.use_ieye === 'true' || sessionStorage.use_ieye === 'true');
    }

    /**
     * Places an alert on screen
     * inputs can be defined as html inputs in an array:
     * [
     *  "<input type='text'></input",
     *  "<button></button>"
     * ]
     * By default, after pressing on a button the alert box closes.
     * @param {*} title Title of the alert (String)
     * @param {*} content Text to dispaly on alert (String)
     * @param {*} inputs Array of inputs on the alert message (Strings, see description above)
     */
    function placeAlert(title, content, inputs) {
        $('#msgH1').empty();
        $('#msgContent').empty();
        $('#msgInputs').empty();

        $('#msgH1').append(title);
        $('#msgContent').append(content);

        $.each(inputs, function (i, o) {
            $('#msgInputs').append(o);
        });

        $('#msgOverlay').css('display', 'flex');
    }

    function updateIndicator(status) {
        // if no indicator is added yet, add one
        // remove all other indicators
        $.each(vcontrol.getPlayerIDs(), function(i, pID) {
            //parent
            var par = $('#' + pID.split('video_')[1]).parent();

            if (pID !== vcontrol.getCurrentPlayerID() && par.find('#indicatorContainer').length > 0) {
                par.find('#indicatorContainer').remove();
            }
        });

        var par = $('#' + vcontrol.getCurrentPlayerID().split('video_')[1]).parent();
        if (par.find('#indicatorContainer').length === 0) {
            var indicator = $('<div id="indicatorContainer"></div>');
            indicator.append('<label class="widgetSwitch" onclick="IEyeController.toggleWidget()"><input id="switchUseWidget" type="checkbox"><span class="widgetSlider"></span></label>');
            indicator.append('<div id="iEyeIndicator" class="indicator" onclick="vcontrol.pauseVideo();IEyeController.recallOverlay()"></div>');
            par.prepend(indicator);    

            $('#iEyeIndicator').hover(function() {
                currentIndicator = $(this).text();
                $(this).text('Click to show menu');
            }, function() {
                $(this).text(currentIndicator);
            });            
        }            

        if (useIEye()) {
            $('#iEyeIndicator').removeClass('indicatorOff').addClass('indicator');
            $('#switchUseWidget').prop('checked', true);
            //update tooltip
            switch(status) {
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

    // =============================================================================
    // Public
    // =============================================================================
    // module.getPlayerState = function () {
    //     return currentPlayerState;
    // };

    module.placeAlert = function (title, content, buttons) {
        placeAlert(title, content, buttons);
    };

    module.hideAlert = function () {
        $('#msgOverlay').hide();
    };

    module.setChoice = function (choice) {
        setChoice(choice);
    };

    module.recallOverlay = function() {
        recallOverlay();
    };

  module.toggleWidget = function() {
    vcontrol.pauseVideo();
    if ($('#switchUseWidget').is(':checked')) {
      module.setChoice(false, true);
    } else {
      module.setChoice(true, true);
    }
  };    

    module.init = function () {
        sessionStorage.iEyeStarted = false;

        // initialize videostatus checker
        // pass callback function which controls what happens for each state.
        // status can be: play pause seek ended.
        vcontrol.init(function (status)  {
            switch (status) {
                case 'play':

                    // if choosed to use widget
                    if (useIEye() && sessionStorage.iEyeStarted !== 'true') {
                        
                        sessionStorage.iEyeStarted = true;
                        ieyewidget.startiEye();
                        widgetStatus = 'start';

                    } else if (useIEye() && sessionStorage.iEyeStarted === 'true') {
                        ieyewidget.resumeiEye();
                        widgetStatus = 'resume';
                    }

                    break;
                case 'pause':

                    // manual pause by user
                    if (useIEye() && !ieyewidget.pausedByIEye) {
                        ieyewidget.pauseiEye();
                        widgetStatus = 'pause';
                    }

                    break;
                case 'ended':
                    if (useIEye()) {
                        ieyewidget.stopiEye();
                        widgetStatus = 'end';
                        sessionStorage.iEyeStarted = false;
                    }
                    break;
                default: // none;
            }
            // update the indicator with the correct status
            updateIndicator(status);
        });

        // initialize controller
        IEWLogger.init();
        init();
    };

    return module;
}) ();

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
      $('#overlay').hide();
  } else {
    edxCheck = setInterval(function() {
      if (analytics && analytics.user) {
          clearInterval(edxCheck);

          var desktop = (prechecker.getEnvironment().mobile == false);
          var webcam = prechecker.webcamIsAvailable();
          var group = (parseInt(analytics.user().id()) % 2 === 0) ? 'ieye' : 'ieye';
          
          if (desktop) {
            console.log('Desktop OK.');
          }

          if (webcam) {
            console.log('Webcam OK.');
          }

          if (group === 'sqeye') {
            if (desktop && webcam) {
              alert('tarmos widget');
            } else {
              // log exception
            }
          } else {
            if (desktop && webcam) {
              setTimeout(function() {
                IEyeController.init();
              }, 500);
            } else {
              IEyeController.hideAlert();
              IEWLogger.init();
              logCheck = setInterval(function() {
                if (IEWLogger.isReady()) {
                  clearInterval(logCheck);
                  if (!desktop) {
                    IEWLogger.logBannedUser('Mobile');                       }                      
                  if (!webcam) {
                    IEWLogger.logBannedUser('No webcam');
                  }                          
                }
              }, 200);  
            }              
          }
      }
    }, 100);
  }
});
