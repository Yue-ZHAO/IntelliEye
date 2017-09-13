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
        var validEnvironment = _isValidEnvironment();
        if (validEnvironment) {
            console.log('SQEYE');
        }
    }

    /**
     * Starts ieye widget
     */
    function _useIeye() {
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

    moocwidget.init = function() {
        console.log('Initializing MOOCWidgets.');

        if (MW_ENABLE_SQUIRRELEYE && MW_ENABLE_INTELLIEYE) {
            // A/B
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
                      mwdet.placeAlert('Webcam permission', 
                        'You need to grant permission to the webcam and refresh the page for the widget to work.', 
                        [`<button class='msgButton' onclick='moocwidget.UI.hideAlert()'>Ok</button>`]
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
            init: function() {
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

            placeAlert: function(title, content, footer) {
                $('#msgH1').empty();
                $('#msgContent').empty();
                $('#msgInputs').empty();

                $('#msgH1').append(title);
                $('#msgContent').append(content);

                $.each(inputs, function(i, o) {
                    $('#msgInputs').append(o);
                });

                $('#msgOverlay').css('display', 'flex');
            },

            hideAlert: function() {
                $('#msgOverlay').hide();
            },
        };
    }) ();
}) (window);

moocwidget.init();
