/* eslint-disable camelcase */
(function(window) {
    window.moocwidget = window.moocwidget || {};

    moocwidget.WIDGET_TYPE = IEYE_Reaction_Type;

    /**
     * Loads nesscessary js files
     * @param {*} files 
     * @param {*} next next function when finished loading
     */
    function _loadjs(files, next) {
        var loaded = 0;
        var loadIntervalRef;
        files.forEach(function(src) {
            // var script = document.createElement('script');
            // script.type = 'text/javascript';
            // script.src = src;
            // script.onload = function() {
            //     loaded+=1;
            // };
            // document.body.appendChild(script);
            $.getScript( src, function( data, textStatus, jqxhr ) {
                console.log( data ); // Data returned
                console.log( textStatus ); // Success
                console.log( jqxhr.status ); // 200
                if (jqxhr.status === 200) {
                    loaded += 1;
                }
            });            
        });
        loadIntervalRef = setInterval(function() {
            if (loaded === files.length) {
                clearInterval(loadIntervalRef);
                next();
            }
        }, 200);
    }    

    /**
     * Starts sqeye widget
     */
    function _useSqeye() {
        var validEnvironment = moocwidget.envChecker.isValidEnvironment();
        if (validEnvironment) {
            moocwidget.UI.initSqeyeHTML();        
            $('head').append( $('<link rel="stylesheet" type="text/css" />')
                .attr('href', 'https://moocwidgets.cc/static/sqeye/css/MWDET.css'));

            var files = [
                'https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/mathjs/3.13.3/math.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/jquery-csv/0.8.3/jquery.csv.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js',
                'https://moocwidgets.cc/static/sqeye/js/sqeye-build.min.js',
            ];

            _loadjs(files, function() {
                mwdet.init();
            });
        } else {
            _loadjs(['https://moocwidgets.cc/static/sqeye/js/sqeye-build.min.js'], function() {
                // var webcam = moocwidget.envChecker.webcamIsAvailable();
                // var desktop = (moocwidget.envChecker.getEnvironment().mobile == false); 
                // var browserInfo = moocwidget.envChecker.isValidBrowser();   

                // if (!desktop) {
                //     mwdet_logger.logBannedUser('Mobile');                       
                // }                      
                // if (!webcam) {
                //     mwdet_logger.logBannedUser('No webcam');
                // }                          

                // if (!browserInfo[0]) {
                //     mwdet_logger.logBannedUser('Browser: ' + browserInfo[1] + ', version: ' + browserInfo[2]);
                // }
            });           
        }
    }

    /**
     * Starts ieye widget
     * @param {String} reaction_type which type ieye to enable (pause, visualAlert, auditoryAlert)
     */
    function _useIeye(reaction_type) {
        var validEnvironment = moocwidget.envChecker.isValidEnvironment();
        if (validEnvironment) {
            moocwidget.UI.initIeyeHTML();
            $('head').append( $('<link rel="stylesheet" type="text/css" />')
                .attr('href', 'https://moocwidgets.cc/static/ieye/css/iew-edx.css'));
     
            var files = [];
            if (reaction_type === 'Pause') {
                files = [
                    'https://moocwidgets.cc/static/ieye/js/ieye-build-pause.min.js',             
                ];
             }
            if (reaction_type === 'VisualAlert') {
                files = [
                    'https://moocwidgets.cc/static/ieye/js/ieye-build-visualAlert.min.js',             
                ];
             }
            if (reaction_type === 'AuditoryAlert') {
                files = [
                    'https://moocwidgets.cc/static/ieye/js/ieye-build-auditoryAlert.min.js',             
                ];
             }
     
            _loadjs(files, function() {
                IEyeController.init();
            });
        } else {
            _loadjs(['https://moocwidgets.cc/static/ieye/js/ieye-build-pause.min.js'], function() {
                var webcam = moocwidget.envChecker.webcamIsAvailable();
                var desktop = (moocwidget.envChecker.getEnvironment().mobile == false);  
                var browserInfo = moocwidget.envChecker.isValidBrowser();
                var reasons = [];
                if (!desktop) {
                    reasons.push('Mobile');
                }                     
                if (!webcam) {
                    reasons.push('No webcam');
                }                         
     
                if (!browserInfo[0]) {
                    reasons.push('Browser: ' + browserInfo[1] + ', version: ' + browserInfo[2]);
                }               

                IEWLogger.logBannedUser(reasons);
            });           
        }
     }
     

    moocwidget.init = function() {
        // if visiting a new URL or refreshing same page
        if (!sessionStorage.getItem('storedURL') || sessionStorage.getItem('storedURL') !== document.URL) {
            sessionStorage.setItem('storedURL', document.URL);
            sessionStorage.setItem('unitsVisited', 1);
            sessionStorage.setItem('facecheckInitialized', 'false');
            if (sessionStorage.getItem('sessionId')) {
                sessionStorage.removeItem('sessionId');
            }
        } else {
            // if changing units
            var ucount = parseInt(sessionStorage.getItem('unitsVisited'));
            sessionStorage.setItem('unitsVisited', ucount+1);
        }
    
        $(window).on('beforeunload', function() {
            sessionStorage.removeItem('facecheckInitialized');
            sessionStorage.removeItem('storedURL');
        }); 

        var setup = function() {
            console.log('Initializing MOOCWidgets.');
            
            // if in studio, we don't start any widgets.
            if (document.URL.indexOf('studio.edge.edx.org') >= 0) {
                return;
            }
            if (MW_ENABLE_INTELLIEYE) {
                if (IEYE_Reaction_Type == 'Pause') {
                    _useIeye('Pause');
                } else if (IEYE_Reaction_Type == 'VisualAlert') {
                    _useIeye('VisualAlert');
                } else if (IEYE_Reaction_Type == 'AuditoryAlert') {
                    _useIeye('AuditoryAlert');
                } else if (IEYE_Reaction_Type == 'ABCTesting') {
                    // A/B
                    var check = setInterval(function() {
                        if (analytics && analytics.user) {
                            clearInterval(check);
                            var remainder = parseInt(analytics.user().id()) % 3;
                            switch (remainder) {
                                case 0:
                                    moocwidget.WIDGET_TYPE = 'Pause';
                                    _useIeye('Pause'); break;
                                case 1:
                                    moocwidget.WIDGET_TYPE = 'VisualAlert';
                                    _useIeye('VisualAlert'); break;
                                case 2:
                                    moocwidget.WIDGET_TYPE = 'AuditoryAlert';
                                    _useIeye('AuditoryAlert'); break;
                                default: // no widgets used
                            }
                        }
                    }, 200);
                    console.log('A/B/C testing');
                } 
            }                                        
        };

        var edxCheck = setInterval(function() {
            if ($('.video').length > 0) {
                clearInterval(edxCheck);
                setup();
            }
        }, 500);
    };

    // =========================================================================
    // Environment
    // =========================================================================
    moocwidget.envChecker = moocwidget.envChecker || (function() {
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
         * @param {function} callIfFail call this function if permission to webcam is denied.
         */
        function checkWebcamState(callIfFail) {
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
                        moocwidget.UI.placeAlert('Webcam permission', 
                            'You need to grant permission to the webcam and refresh the page for the widget to work.', 
                            []
                        );
                        if (typeof callIfFail !== 'undefined') {
                            callIfFail();
                        }
                    }
                });
            }
        }        
      
        /**
         * @return {*} Returns the environment of the user in object format:
            return {
                'OS': OS,
                'browser': browser,
                'browserVersion': version,
                'mobile': mobile,
                'screenHeigth': screen.height,
                'screenWidth': screen.width,
            };         
         */
        function getEnvironment() {
            // detect operating system.
            var OS = 'unknown';
            var browser = 'unkown';
            var version = 'unknown';
            var mobile = false;

            var client = new ClientJS();            

            return {
                'OS': client.getOS(),
                'OSVersion': client.getOSVersion(),
                'browser': client.getBrowser(),
                'browserVersion': client.getBrowserMajorVersion(),
                'mobile': client.isMobile(),
                'screenHeigth': screen.height,
                'screenWidth': screen.width,
            };
        }

        /**
         * Returns whether browser is valid
         * @return {array} [true/false, browser, browserversion]
         */
        function isValidBrowser() {
            var client = new ClientJS();
            var opera = client.isOpera() && (client.getBrowserMajorVersion() > 40);
            var firefox = client.isFirefox() && (client.getBrowserMajorVersion() > 44);
            var chrome = client.isChrome() && (client.getBrowserMajorVersion() > 53);
            var browserOK = opera || firefox || chrome;
            return [browserOK, client.getBrowser(), client.getBrowserMajorVersion()];
        }
        
        /**
         * @return {bool} true if browser and webcam are OK.
         */
        function isValidEnvironment() {
            var client = new ClientJS();
            var browserOK = isValidBrowser()[0];
            return browserOK && webcamIsAvailable() && !client.isMobile();
        }
      
        return {
            getEnvironment: function() {
                return getEnvironment();
            },

            isValidBrowser: function() {
                return isValidBrowser();
            },

            isValidEnvironment: function() {
                return isValidEnvironment();
            },
      
            webcamIsAvailable: function() {
                return webcamIsAvailable();
            },
      
            webcamState: function(callIfFail) {
                checkWebcamState(callIfFail);
            },
        };
      })();    

    // =========================================================================
    // UI
    // =========================================================================
    moocwidget.UI = (function() {
        return {
            initIeyeHTML: function() {
                $('body').append(`
                    <div class="msgOverlay" id="msgOverlay">
                        <div class="msgBox">
                            <div class="msgTitle">
                                <img src="https://moocwidgets.cc/static/ieye/img/intellieye_logo_edx_h60.png">
                                <h1 class="customh1" id="msgH1">Title</h1>
                            </div>
                            <div class="msgContent" id="msgContent">Test Message</div>
                            <div class="msgButtons" id="msgInputs">
                                <button class="msgButton"> Confirm </button>
                                <button class="msgButtonFaded">Cancel</button>
                                </div>
                        </div>
                    </div>            
                `);
            },

            initSqeyeHTML: function() {
                if (parseInt(sessionStorage.getItem('unitsVisited')) > 1) {
                    return;
                }
                $('body').append(`
                    <div class="mwdet-main">
                        <div class="MWDET-setup">
                            <div class="MWDET-overlay"></div>
                            <div class="MWDET-container">
                                <div id="calibrationOverlay"><div id="cal-progress"></div><div id="cal-info"></div></div>
                                <div class="overlay">
                                    <div class="fcContent">
                                        <div class="facecheckContainer"></div>
                                        <div class="fcExamples">
                                            <div id="img1" class="fcExample boxshadow"><img src="https://moocwidgets.cc/static/sqeye/img/fc_insufficient.png", alt="insufficient", width="240", height="180"></div>
                                            <div id="img1" class="fcExample boxshadow"><img src="https://moocwidgets.cc/static/sqeye/img/fc_sufficient.png", alt="sufficient", width="240", height="180"></div>
                                        </div>
                                    </div>
                                    <div id="fc_infobox"></div>    
                                </div>
                                
                            </div>
                        </div>

                        <div class="mwdet-msg-overlay" id="msgOverlay" style="display:none">
                            <div class="mwdet-msg-box" id="msgBox">
                                <div class="mwdet-msg-title" id="msgTitle">
                                    <img src="https://moocwidgets.cc/static/sqeye/img/sqeye-logo-blue.png">
                                    <h1 class="customh1" id="msgH1">Title</h1>
                                </div>
                                <div class="mwdet-msg-content" id="msgContent">Test Message</div>
                                <div class="mwdet-msg-inputs" id="msgInputs">
                                    <button class="edx-button"> Confirm </button>
                                    <button class="edx-button-faded">Cancel</button>
                                    </div>    
                            </div>
                        </div>
                    </div>                
                `);
            },

            placeAlert: function(title, content, footer, events='undefined') {
                $('#msgH1').empty();
                $('#msgContent').empty();
                $('#msgInputs').empty();

                $('#msgH1').append(title);
                $('#msgContent').append(content);

                $.each(footer, function(i, o) {
                    $('#msgInputs').append(o);
                });

                if (events !== 'undefined') {
                    eval(events);
                }
                $('#msgOverlay').css('height', (parseInt($('body').outerHeight()) + 100) + 'px');
                $('#msgOverlay').css('display', 'flex');
                $(window).scrollTop(0);
            },

            hideAlert: function() {
                $('#msgOverlay').hide();
            },

            ieye_intro: function() {               
                if ($('.introOverlay').length === 0) {
                    $('body').append('<div class="introOverlay"></div>');
                    $('.introOverlay').append(ieye_intro_content); // in /templates folder, compiled into ieyewidget.js
                }
                $('.introOverlay').css('height', (parseInt($('body').outerHeight()) + 100) + 'px');
                $('.introOverlay').css('display', 'flex');
                $(window).scrollTop(0);
            },

            ieye_intro_hide: function() {
                $('.introOverlay').hide();
            },

            mwdet_intro: function() {
                moocwidget.UI.placeAlert('Welcome to SquirrelEye',
                    `
                    For this course, we offer you an experimental widget <b>SquirrelEye</b> for inattention-detection during the lecture video playing. 
                    <br>
                    SquirrelEye can help you to keep your attention during the lecture video playing. 
                    Once your inattention is detected, SquirrelEye will alert you by a beeping sound and a highlighted area around the video playing area. 
                    SquirrelEye is an automated privacy-aware (i.e. none of the webcam data leaves your computer) assistant for you on the edX platform.

                <div class="intro-textimg">
                    <div>
                    <p style="width:500px">
                        To use SquirrelEye:
                        <ul>
                            <li>allow the edx site to use your webcam when you are asked to do so</li>
                            <li>follow the instructions to calibrate your webcam</li>
                            <li>face the camera and watch the video as you normally would</li>
                        </ul>                   
                    </p>
                    </div>
                    <img src="https://moocwidgets.cc/static/sqeye/img/sqeye-intro-process.png" style="width:400px">
                </div>    

                SquirrelEye is developed by TU Delft. Using this widget will be helpful for us to make better inattention-detection widgets in the future. 
                If you have any questions or feedback, please send email to <a href="mailto:y.zhao-1@tudelft.nl">y.zhao-1@tudelft.nl</a>

                <span class="sq-intro-span" onclick="$('#howto-a').slideToggle()"><h2 class='h2-section'>How does it work?<span style='margin-left:5px'>Learn more</span></h2></span>
                    <div id="howto-a" class="intro-textimg" style="display:none">
                        <p style="width:500px">
                            SquirrelEye uses your computer webcam, with your permission, and looks for a face frame in the camera feed. 
                            Based on detected face frame, SquirrelEye can esimate your gaze on the screen and detect your inattention based on your gaze movements. 
                            SquirrelEye is <b>privacy-aware</b> - no videofeed leaves your computer.
                            <br>
                            If you want to know more about our research, please check <a href="https://yue-zhao.github.io/MWDET_Project/">our previous studies</a>.
                        </p>
                        <div>
                            <img src="https://moocwidgets.cc/static/sqeye/img/sqeye-intro-works.png" style="width:400px">
                        </div>
                    </div>

                <span class="sq-intro-span" onclick="$('#what-a').slideToggle()"><h2 class='h2-section'>What are required for using SquirrelEye?<span style='margin-left:5px'>Learn more</span></h2></span>
                    <div id="what-a" style="display:none">
                        <ol>
                        <li>SquirrelEye can only run on laptop and desktop computers. We do not support mobile platforms.</li>
                        <li>You can use SquirrelEye with some modern web browsers, e.g., the latest version of Firefox, Opera and Chrome. Internet Explorer, Microsoft Edge and Safari are not supported currently. </li>
                        <li>We need your permission to use the built-in camera or the external camera on your machine. The camera should be aligned with the screen you are watching the video on.</li>
                        </ol>
                    </div>

                <span class="sq-intro-span" onclick="$('#attention-a').slideToggle()"><h2 class='h2-section'>What do I need to do to use SquirrelEye?<span style='margin-left:5px'>Learn more</span></h2></span>
                    <div id="attention-a" style="display:none">
                        As SquirrelEye depends on face and eye detection in the web camera video feed, you should pay attention to the following:
                        <ul>
                        <li>Enable your webcam once asked</li>
                        <li>Sit normally facing the camera.</li>
                        <li>Try not to put your hand around your face or between your face and the webcam.</li>
                        <li>Try not to lean back or forward heavily.</li>
                        <li>Focus on the video content as you would do in a regular classroom setting.</li>
                        </ul>
                    </div>
                `,
                ['<button id=\'bEnable\' class=\'edx-button\' onclick=\'mwdet.handleUsersChoice(true); moocwidget.UI.hideAlert()\'> Enable SquirrelEye </button>',
                    '<button id=\'bDisable\' class=\'edx-button-faded\' onclick=\'mwdet.handleUsersChoice(false); moocwidget.UI.hideAlert()\'> Disable SquirrelEye </button>',
                    '<input id=\'intro_askAgain\' name=\'i_remember\' type=\'radio\' checked> <label for="intro_askAgain">Always ask me</label>',
                    '<input id=\'intro_remember\' name=\'i_remember\' type=\'radio\'> <label for="intro_remember"> Remember this choice </label>'
                    +
                    `
                <i style="display:block;margin-top:20px">If you want to change the choice you have made here, 
                    click on the <img src="https://moocwidgets.cc/static/sqeye/img/sqeye-logo-blue-sm.png" style="vertical-align:middle;"> icon above the video.</i>      
                `,
                ],
                `
                    $('.sq-intro-span').on('click', function() {
                        if ($(this).find('span').first().text() === 'Learn more') {
                            $(this).find('span').first().text('Hide');
                        } else {
                            $(this).find('span').first().text('Learn more');
                        }
                    });
                `
                ); 
            },
        };
    }) ();
}) (window);

moocwidget.init();
