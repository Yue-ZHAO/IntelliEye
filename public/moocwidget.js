(function(window) {
    window.moocwidget = window.moocwidget || {};

    moocwidget.init = function() {
        console.log('Initializing MOOCWidgets.');

        if (MW_ENABLE_SQUIRRELEYE) {
            // sqeye
            if (webcam && desktop) {

            }
        } else if (MW_ENABLE_INTELLIEYE) {
            // ieye
        } else if (MW_ENABLE_SQUIRRELEYE && MW_ENABLE_INTELLIEYE) {
            // both
        } else {
            // none
        }
    };

    moocwidget.useSqeye = function() {

    };

    moocwidget.useIeye = function() {

    };

    /**
     * Checks if the user is in an environment fit for widget.
     * @return {bool} Returns true if environment can support widget, else false.
     */
    function isValidEnvironment() {
        var webcam = moocwidget.envChecker.webcamIsAvailable();
        var desktop = (moocwidget.envChecker.getEnvironment().mobile == false);
        return webcam && desktop;   
    }

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
                      mwdet.placeAlert('Webcam permission', 'You need to grant permission to the webcam and refresh the page for the widget to work.', 
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
      }) ();    
}) (window);
