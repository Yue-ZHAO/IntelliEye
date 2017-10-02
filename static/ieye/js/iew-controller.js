/*eslint-disable*/
var IEYEVERSION = '01';

window.IEyeController = window.IEyeController || (function() {
    var module = {}; // store public functions here
    var widgetStatus = 'end';
    var fullscreen = false;
    // =========================================================================
    // Private 
    // =========================================================================

    /**
     * Initialize module
     */
    function init() {
        console.log('initializing controller');
        $(window).scrollTop(0);
        
        $('#overlay').css('height', $('body').outerHeight() + 'px');

        $('#i_dont_remember').prop('checked', true);

        // setting up correct layout (sizes)
        $('.main-container').prepend($('#overlay'));
        $('.add-fullscreen').on('click', function() {
            if (fullscreen) {
                $('#indicatorContainer').css('position', 'relative');
                fullscreen = false;
            } else {
                $('#indicatorContainer').css('position', 'absolute');
                fullscreen = true;
            }
        });

        $('.seq_video').on('click', function() {
            if (useIEye()) {
                ieyewidget.stopiEye();
                widgetStatus = 'end';
                sessionStorage.iEyeStarted = false;
            }
        });

        // $('#overlay').css('height', $('body').height() + 'px');
        // $('#overlay-container').css('height', $(window).height());

        updateIndicator();

        if (!localStorage.use_ieye)
            moocwidget.UI.ieye_intro();
    }

    /**
     * Used to recall the introduction overlay when the indicator is clicked.
     */
    function recallOverlay() {
        $(window).scrollTop(0);
        vcontrol.pauseVideo(); 
        moocwidget.UI.ieye_intro(); 
        
        //TODO: test
        // force fullscreen off to show intro
        if (fullscreen) {
            $('#'+vcontrol.getCurrentPlayerID()).find('button').closest('.control.add-fullscreen').click();
        }
    }    

    // set user's choice of using ieye (true/false)
    function setChoice(widgetIsUsed, fromSwitch=false) {
        vcontrol.pauseVideo();

        var askAgain = fromSwitch || $('input#i_dont_remember').is(':checked');

        localStorage.use_ieye = widgetIsUsed;
        sessionStorage.use_ieye = widgetIsUsed;
        $.cookie('use_ieye', widgetIsUsed);        

        if (askAgain) {
            localStorage.removeItem('use_ieye');
        } 

        // when user changes decision when the video is playing
        // stop ieye if they chooses not to use the widget
        // start ieye if they chooses to use the widget
        if (widgetIsUsed) {
            moocwidget.envChecker.webcamState();

            // log if widget allowed, and whether it choice is remembered.
            IEWLogger.logWidgetStatus('allow', !askAgain);

            if (sessionStorage.iEyeStarted == 'false') {
                ieyewidget.startiEye();
                sessionStorage.iEyeStarted = true;            
            }
            $('#switchUseWidget').prop('checked', true);
        } else {
            console.log('not using vid playing');
            if (askAgain) {
                IEWLogger.logWidgetStatus('skip', false);
            } else {
                IEWLogger.logWidgetStatus('disallow', true);

                // when user disables widget and remembers the choice
                moocwidget.UI.placeAlert('You have disabled the widget',
                `
                    <p> Please tell us the reason you chose to disable the widget </p>
                    <textarea id="ieyeFeedbackContent" rows="5" cols="80"></textarea>    
                    
                `,
                ['<div class="msgButton" id="ieyeSendFeedback" >Send feedback</div>'],
                `
                    $("#ieyeSendFeedback").on('click', function() {
                        var data = {
                            time: Date.now(),
                            userID: IEWLogger.getUserId(),
                            sessionID: IEWLogger.getSessionId(),
                            feedbackContent: $('#ieyeFeedbackContent).val(),
                            pageURL: document.URL,
                            pageTitle: document.title,
                            videoID: vcontrol.getCurrentPlayerID(),
                            videoTime: vcontrol.getCurrentTime(),
                            videoDuration: vcontrol.getDuration()
                        };

                        IEWLogger.logFeedbackOnDisable(data);
                    });
                `);
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
                $(this).text('Show menu');
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
                    $('#iEyeIndicator').removeClass('indicator').addClass('indicatorOff');
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

    module.setChoice = function (choice, fromSwitch) {
        setChoice(choice, fromSwitch);
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
            // YUE, will this function be called every time when the status change?
            // TODO, should we also consider previours status here? I am not sure
            // Since I received some video status from Youtube like "play -> play" in my crowdsourcing task before
            switch (status) {
                case 'play':

                    // if choosed to use widget
                    if (useIEye() && sessionStorage.iEyeStarted !== 'true') {
                        moocwidget.envChecker.webcamState();
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
            IEWLogger.logWidgetStatus(widgetStatus);
            ieyewidget.updateAndLogMetrics();
            updateIndicator(status);
        });

        // initialize controller
        IEWLogger.init();
        init();
    };

    return module;
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