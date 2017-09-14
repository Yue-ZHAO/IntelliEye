(function(window) {
    window.moocwidget = window.moocwidget || {};

    /**
     * Loads nesscessary js files
     * @param {*} files 
     * @param {*} next next function when finished loading
     */
    function _loadjs(files, next) {
        var loaded = 0;
        var loadIntervalRef;
        files.forEach(function(src) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.onload = function() {
                loaded+=1;
            };
            document.body.appendChild(script);
        });
        loadIntervalRef = setInterval(function() {
            if (loaded === files.length) {
                clearInterval(loadIntervalRef);
                next();
            }
        }, 200);
    }    

    /**
     * Checks if the user is in an environment fit for widget.
     * @return {bool} Returns true if environment can support widget, else false.
     */
    function _isValidEnvironment() {
        var webcam = moocwidget.envChecker.webcamIsAvailable();
        var desktop = (moocwidget.envChecker.getEnvironment().mobile == false);
        return webcam && desktop;   
    }    

    /**
     * Starts sqeye widget
     */
    function _useSqeye() {
        moocwidget.UI.initSqeyeHTML();

        var validEnvironment = _isValidEnvironment();
        if (validEnvironment) {
            $('head').append( $('<link rel="stylesheet" type="text/css" />')
                .attr('href', 'https://moocwidgets.cc/static/sqeye/css/MWDET.css'));

            // TODO: minimize
            var files = [
                'https://moocwidgets.cc/static/sqeye/js/RTP.js',
                'https://moocwidgets.cc/static/sqeye/js/webgazer_mod.js',
                'https://moocwidgets.cc/static/sqeye/js/MWDET_gazer.js',
                'https://moocwidgets.cc/static/sqeye/js/MWDET_calibration.js',
                'https://moocwidgets.cc/static/sqeye/js/MWDET_gazerdata.js',
                'https://moocwidgets.cc/static/sqeye/js/MWDET_vcontrol.js',
                'https://moocwidgets.cc/static/sqeye/js/MWDET_logger.js',
                'https://moocwidgets.cc/static/sqeye/js/MWDET_widget.js',
            ];

            _loadjs(files, function() {
                mwdet.init();
            });
        } else {
            var logCheck = setInterval(function() {
            if (IEWLogger.isReady()) {
                clearInterval(logCheck);
                var webcam = moocwidget.envChecker.webcamIsAvailable();
                var desktop = (moocwidget.envChecker.getEnvironment().mobile == false);                
                if (!desktop) {
                    IEWLogger.logBannedUser('Mobile');                       
                }                      
                if (!webcam) {
                    IEWLogger.logBannedUser('No webcam');
                }                          
            }
            }, 200);              
        }
    }

    /**
     * Starts ieye widget
     */
    function _useIeye() {
        moocwidget.UI.initIeyeHTML();

        var validEnvironment = _isValidEnvironment();
        if (validEnvironment) {
            $('head').append( $('<link rel="stylesheet" type="text/css" />')
                .attr('href', 'https://moocwidgets.cc/static/ieye/css/iew-edx.css'));

            // TODO: minimize
            var files = [
                'https://moocwidgets.cc/static/ieye/js/tracking-mod.js',
                'https://moocwidgets.cc/static/ieye/js/face-min.js',
                'https://moocwidgets.cc/static/ieye/js/client.min.js',              
                'https://moocwidgets.cc/static/ieye/js/iew-vcontrol.js',              
                'https://moocwidgets.cc/static/ieye/js/ieyewidget.js',              
                'https://moocwidgets.cc/static/ieye/js/iew-log.js',              
                'https://moocwidgets.cc/static/ieye/js/iew-controller.js',              
            ];

            _loadjs(files, function() {
                IEyeController.init();
            });
        } else {
            var logCheck = setInterval(function() {
                if (mwdet_logger.isReady()) {
                    clearInterval(logCheck);
                    var webcam = moocwidget.envChecker.webcamIsAvailable();
                    var desktop = (moocwidget.envChecker.getEnvironment().mobile == false);                
                    if (!desktop) {
                        mwdet_logger.logBannedUser('Mobile');                       
                    }                      
                    if (!webcam) {
                        mwdet_logger.logBannedUser('No webcam');
                    }                          
                }
            }, 200);              
        }
    }

    moocwidget.init = function() {
        console.log('Initializing MOOCWidgets.');

        if (MW_ENABLE_SQUIRRELEYE && MW_ENABLE_INTELLIEYE) {
            // A/B
            var check = setInterval(function() {
                if (analytics && analytics.user) {
                    clearInterval(check);
                    var remainder = parseInt(analytics.user().id()) % 5;
                    switch (remainder) {
                        case 0: case 1:
                            _useSqeye(); break;
                        case 2: case 3:
                            _useIeye(); break;
                        default: // no widgets used
                    }
                }
            }, 200);
            console.log('A/B/C testing');
        } else if (MW_ENABLE_SQUIRRELEYE) {
            _useSqeye();
        } else if (MW_ENABLE_INTELLIEYE) {
            _useIeye();
        } else {
            // none
        }
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
                      moocwidget.UI.placeAlert('Webcam permission', 
                        'You need to grant permission to the webcam and refresh the page for the widget to work.', 
                        []
                    );
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
                            <div class="msgTitle"><h1 class="customh1" id="msgH1">Title</h1></div>
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
                                <div class="mwdet-msg-title"><h1 class="customh1" id="msgH1">Title</h1></div>
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

            placeAlert: function(title, content, footer) {
                $('#msgH1').empty();
                $('#msgContent').empty();
                $('#msgInputs').empty();

                $('#msgH1').append(title);
                $('#msgContent').append(content);

                $.each(footer, function(i, o) {
                    $('#msgInputs').append(o);
                });

                $('#msgOverlay').css('display', 'flex');
            },

            hideAlert: function() {
                $('#msgOverlay').hide();
            },

            ieye_intro: function() {
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
                            <span class='lm' id='lm1'><h2 class='h2-section'>How does it work?<span id='lm1-text'>  Learn more</span></h2></span>
                                    <p class='ieye_descr' id='lm1-d'>Intellieye uses your computer webcam, with your permission, and looks for a face frame in the camera feed. <br/>Intellieye
                                        is <b>privacy aware</b> – no videofeed leaves your computer.
                                    <br>
                                    <img src="https://moocwidgets.cc/static/ieye/img/ieye_instructions2.png" width="400px" style="margin-top:10px">
                                    </p>
                            
                            <span class='lm' id='lm2'><h2 class='h2-section'>What do I need to use Intellieye?<span id='lm2-text'>  Learn more</span></h2></span>
                                    <p class='ieye_descr' id='lm2-d'>You can use Intellieye with any of the modern web browser, i.e., latest version on Firefox, Opera, Chrome, Safari (11+),
                                        and MS Edge. Unfortunately, Internet Explorer is not supported. If you have one of the supported browsers, all you
                                        need to use Intellieye is to allow camera access in browser when you are asked for it.</p>
                                    <span class='lm' id='lm3'><h2 class='h2-section'>What should I pay attention to?<span id='lm3-text'>  Learn more</span></h2></span>
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
                                        <div id='start_ieye'>Enable IntelliEye</div>
                                        <div id='skip_ieye'>Disable IntelliEye</div>
                                        <div id='remember_ieye'> For future:
                                            <input name="r_remember" type="radio" value="no" id='i_dont_remember' checked><label for='i_dont_remember'>Always ask me</label>
                                            <input name="r_remember" type="radio" value="yes" id='i_remember'><label for='i_remember'>Remember my choice</label>
                                        </div>
                                    </div>
                                    <i style="display:block;margin-top:20px">To recall this window, click on the <img src="https://moocwidgets.cc/static/ieye/img/intellieye_logo_edx_h60.png" width="20" height:"20" style="vertical-align:middle"> icon above the video.</i>
                                </div>
                            </div>
                        </div>        
                `);                
            },

            mwdet_intro: function() {
                moocwidget.UI.placeAlert('SquirrelEye',
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

                <span onclick="$('#howto-a').slideToggle()"><h2 class='h2-section'>How does it work?<span > Learn more</span></h2></span>
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

                <span onclick="$('#what-a').slideToggle()"><h2 class='h2-section'>What do I need to use SquirrelEye?<span > Learn more</span></h2></span>
                    <div id="what-a" style="display:none">
                        <ol>
                        <li>SquirrelEye can only run on laptop and desktop computers. We do not support mobile platforms.</li>
                        <li>You can use SquirrelEye with any modern web browser, e.g., latest version on Firefox, Opera, Chrome, and Microsoft Edge. Internet Explorer is not supported.</li>
                        <li>We need your permission to use the built-in camera on your machine. External camera should be aligned with the screen you are watching the video on.</li>
                        </ol>
            </div>

                <span onclick="$('#attention-a').slideToggle()"><h2 class='h2-section'>What do I need to pay attention to?<span > Learn more</span></h2></span>
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
                        '<input id=\'intro_askAgain\' name=\'i_remember\' type=\'radio\' checked>Always ask me</input>',
                        '<input name=\'i_remember\' type=\'radio\'> Remember this choice </input>'
                        +
                        `
                    <i style="display:block;margin-top:20px">If you want to change the choice you have made here, 
                        click on the <img src="https://moocwidgets.cc/static/sqeye/img/sqeye-logo-blue-sm.png" style="vertical-align:middle;"> icon above the video.</i>      
                    `,
                    ]); 
            },
        };
    }) ();
}) (window);

moocwidget.init();
