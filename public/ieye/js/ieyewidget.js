/* eslint-disable */
'use strict';
(function () {
	window.ieyewidget = window.ieyewidget || {};
	ieyewidget.logMetricsEnabled = true;

	var trackerTaskReference;
	var tjs; 						// 0 = defocus, 1=focus
	var iEyeIntervalRef = null;			// interval reference
	var iEyeIntervalMs = 250;		// interval millisecs; sampling
	var iEyeIntervalRef2 = null;			// interval reference
	var iEyeIntervalMs2 = 1000;		// interval millisecs; decision
	var fps = 20;					// frames per second with tjs
	var initiateTime;				// time of iEye initialization
	var coldStartDelayTime = 5000;	// cold start delay to let the tjs initiialize; in ms
	var streamLengthSeconds = 5;
	var itemsInStream = 5 * ( 1000/iEyeIntervalMs );
	var tjsThresholdDefocus = 2.92;		// below this value we call it defocus
	var tjsThresholdFocus =4.4;		// below this value we call it defocus

	// metrics
	var streamTjs = "";		// tjs detection stream
	var streamVis = "";		// window/tab visibility
	var streamFoc = "";		// window/tab focus
	var streamMou = "";		// mousemove
	var mmoveCoords = {x: [0,0],y: [0,0]};		// mousemove coordinatest, present and previous
	var defocusStartTimeMs;
	var defocusStartTimeReset = true;

	// scores
	var scoreTjs = 0;
	var scoreTjsMem = [];

	// iEye global vars
	var iEyeHasFocus = false;	// detected status
	ieyewidget.pausedByIEye = false;	// has iEye paused the video

	// preflightcheck notifications
	var preflightNote;


	/** 
	 *	----------------- Collect the metrics stream -----------------
	*/
	
	function collectMetrics() {
		//tjs metrics
		if (Date.now() > initiateTime + 5000) {	//after cold start start collecting stream
			streamTjs = tjs + streamTjs;
			if ( streamTjs.length > itemsInStream) streamTjs = streamTjs.substr(0, itemsInStream);
			
			// window / tab focus
			if (document.hasFocus())	streamFoc = "1" + streamFoc;
			else streamFoc = "0" + streamFoc;

			if ( streamFoc.length > itemsInStream) streamFoc = streamFoc.substr(0, itemsInStream);
			
			// window / tab visibility
			if (document.hidden)	streamVis = "0" + streamVis;
			else streamVis = "1" + streamVis;
			if ( streamVis.length > itemsInStream) streamVis = streamVis.substr(0, itemsInStream);
			
			//mousemove
			if( mmoveCoords.x[0] != mmoveCoords.x[1] || mmoveCoords.y[0] != mmoveCoords.y[1] ) {	//mouse has moved
				streamMou = "1" + streamMou;
				mmoveCoords.x[1] = mmoveCoords.x[0];
				mmoveCoords.y[1] = mmoveCoords.y[0];
			}
			else {
				streamMou = "0" + streamMou;
			}
			if ( streamMou.length > itemsInStream) streamMou = streamMou.substr(0, itemsInStream);

		}
	}
	
	/**
	 * ----------------- Mousemove detection via jQuery -----------------
	 */
	$(document).mousemove(function( event ) {
		if ( mmoveCoords.x[0] != event.pageX || mmoveCoords.y[0] != event.pageY ) {
			mmoveCoords.x[0] = event.pageX;
			mmoveCoords.y[0] = event.pageY;
		}
	});  
	
	/** 
	 *	----------------- Calculate the score value for a metric -----------------
	*/
	function calculateScrore(stream) {
		var i, score=0;
		for (i=0; i<stream.length; i++) {
			score = score + parseInt(stream[i])*(itemsInStream-1-i)/(itemsInStream-1);
		}
		
		// modify score memory
		scoreTjsMem.unshift(scoreTjs);
		if (scoreTjsMem.length > 3 ) scoreTjsMem.pop();
		
		return score;
	}

	/**
	 * ----------------- Finds the score trend and returns either -1 for decrease (i.e., towards defocus), or +1 as towards focused engagement -----------------
	 */
	function getCurrentTrend() {
		var trend = 0;
		
		if ( scoreTjsMem[0] > scoreTjsMem[1] && scoreTjsMem[1] > scoreTjsMem[2] )	// focus
			trend = 1;
		else if ( scoreTjsMem[0] > scoreTjsMem[1] && scoreTjsMem[1] < scoreTjsMem[2] )
			trend = 1;
		else if ( scoreTjsMem[0] < scoreTjsMem[1] && scoreTjsMem[1] > scoreTjsMem[2] )
			trend = 0;
		else if ( scoreTjsMem[0] < scoreTjsMem[1] && scoreTjsMem[1] < scoreTjsMem[2] )
			trend = -1;
			
		return trend;
	} 

	/** 
	 *	----------------- Handle scores and make a decision -----------------
	*/
	function handleDecision() {
		var isDefocus = false; 	// true= defocus detected
		var trend = getCurrentTrend();
		var hasFocus = document.hasFocus();
		var isVisible = !document.hidden;
		
		scoreTjs = calculateScrore(streamTjs);
		var scoreMou = calculateScrore(streamMou);
		
		
		if ( scoreTjs < tjsThresholdDefocus ) {	//defocus by tjs
			if (trend == 1) {	//presently defocused on cam, but trend is positive
				//do nothing, wait
			}
			else if (trend == 0 || trend == -1) {
				//check visible and winfocus scores, mousemovement
				if (hasFocus && isVisible && scoreMou > 2.9 )	{	// working in the window but no tjs presence
					isDefocus = false;
				}
				else 
					isDefocus = true;
			}
		}
		else if ( scoreTjs > tjsThresholdFocus && isVisible) {
			isDefocus = false;	
		}
		else if ( scoreTjs > tjsThresholdFocus && isVisible == false) {
			isDefocus = true;			
		}
		
		// do some stuff 
		if (isDefocus == true) {
			if (defocusStartTimeReset == true) defocusStartTimeMs = Date.now();
			defocusStartTimeReset = false;
			if (showCam()) {
				console.log("------------DEFOCUS--------------");
			}
			iEyeHasFocus = false;
			ieyewidget.pausedByIEye = true;
			iEyeVideoPause();
		}
		else {
			if (showCam())  { console.log("**FOCUS**"); }
			iEyeHasFocus = true;
			ieyewidget.pausedByIEye = false;
			iEyeVideoResume();
		}
			
		return isDefocus;
	}

	/**
	 *	----------------- Sets the time in second on how much should be rewinded -----------------
	*/
	function getRewindSeconds() {
		var defocusTime = Date.now() - defocusStartTimeMs;
		defocusStartTimeReset = true;
		console.log (">>>>>>>>>>>>>>>>< defcustimev = " + defocusTime);
		if (defocusTime < 1500) return 0;
		else if (defocusTime > 10000) return 10;
		else return 3;
		
	}

	/** 
	 * ----------------- Get debug parameter(s) from the URL -----------------
	 */
	function getUrlParameter(name) {
		name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
		var results = regex.exec(location.search);
		return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
	};

	var showCam = function () {
		if (getUrlParameter('view') == 'y') 
			return true;
		else 
			return false;
	};


	/** 
	----------------- Initialize trackingjs -----------------
	*/

	function initTrackerJs(trackerTaskReference) {
		
		var tjsCanvas, tjsContext, tjsDetection;
		var width = 320;
		var height = 240;
		var topDist = '0px';
		var leftDist = '0px';
		
		$( "body" ).prepend( "<video id=\"iEyeVideoFeed\" width=\"320\" height=\"240\" preload autoplay loop muted></video>" );

		
		if ( showCam() == false  ) {
			var tjsVideo = document.getElementById('iEyeVideoFeed');
			tjsVideo.style.visibility = 'hidden';
			tjsVideo.style.position = 'absolute';
			tjsVideo.style.top = -2 * height + 'px';
			tjsVideo.style.left = -2 * width + 'px';
		}
		
		if (showCam()) { // show cam feed for debugging
			$( "body" ).append( "<canvas id='overlay-trackerjs'></canvas>");
			tjsCanvas = document.getElementById('overlay-trackerjs');
				tjsCanvas.style.position = 'absolute';
				tjsCanvas.width = width;
				tjsCanvas.height = height;
				tjsCanvas.style.top = topDist;
				tjsCanvas.style.left = leftDist;
				tjsCanvas.style.zIndex  = 9999;
			tjsContext = tjsCanvas.getContext('2d');	
		} 
			
		
			
			var tracker;	//var tracker = new tracking.ObjectTracker(['face', 'eye', 'mouth']);
			try {
				tracker = new tracking.ObjectTracker(['face']);
			} catch (e) {
				tracker = new tracking.ObjectTracker('face');
			}

			tracker.setInitialScale(4);  	// the smaller, the smaller faces it can discover, however small values are in trouble with big faces over all area.
			tracker.setStepSize(1.7);			// how fast is the recognition
			tracker.setEdgesDensity(0.1);	// the smaller the better; 0.1 would be ok
			

		tracker.on('track', function(event) {
			if ( showCam() ) tjsContext.clearRect(0, 0, tjsCanvas.width, tjsCanvas.height);
			if (event.data.length === 0) {
				// No objects were detected in this frame.
				tjs = 0;
			} else {
				event.data.forEach(function(rect) {
				// rect.x, rect.y, rect.height, rect.width
			
					if ( showCam() ) {
						tjsContext.strokeStyle = '#a64ceb';
						tjsContext.strokeRect(rect.x, rect.y, rect.width, rect.height);
						tjsContext.font = '11px Helvetica';
						tjsContext.fillStyle = "#fff";
						tjsContext.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
						tjsContext.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);	
					} 
					tjs = 1;
				});
			}
		});

		try {
			// var trackerTask = tracking.track('#iEyeVideoFeed', tracker, { camera: true });
			var trackerTask = tracking.track('#iEyeVideoFeed', tracker, { camera: true, fps: fps });	//with -mod version set the framerate.
			trackerTaskReference = trackerTask;
			return trackerTask;
		}
		catch(err) {
			alert("Failed to initialize TrackerJs: " + err.message + ". If by default your webcam is not allowed, enable it and refresh the page.");
		}
		
		
	} //f. initTrackerJs

	// ----------------- START -----------------
	ieyewidget.startiEye = function() {
			trackerTaskReference = initTrackerJs(trackerTaskReference);
			initiateTime = Date.now();
			
			// set the initial value for stream (default for cold start)
			var i;
			for (i=0; i<itemsInStream; i++) {
				streamTjs = "1" + streamTjs; 
				streamFoc = "1" + streamFoc;
				streamMou = "1" + streamMou;
				streamVis = "1" + streamVis;
			}
			//if paused, need to trim
			if ( streamTjs.length > itemsInStream) streamTjs = streamTjs.substr(0, itemsInStream);
			if ( streamFoc.length > itemsInStream) streamFoc = streamFoc.substr(0, itemsInStream);
			if ( streamVis.length > itemsInStream) streamVis = streamVis.substr(0, itemsInStream);
			if ( streamMou.length > itemsInStream) streamMou = streamMou.substr(0, itemsInStream);
			
			
			// collect metrics by set interval
			iEyeIntervalRef = (iEyeIntervalRef === null) ?  setInterval(collectMetrics, iEyeIntervalMs) : iEyeIntervalRef;
			iEyeIntervalRef2 = (iEyeIntervalRef2 === null) ? setInterval(handleDecision, iEyeIntervalMs2) : iEyeIntervalRef2;
	};

	// ----------------- PAUSE ----------------- 
	ieyewidget.pauseiEye = function() {
		clearInterval(iEyeIntervalRef); 
		iEyeIntervalRef = null;
		clearInterval(iEyeIntervalRef2);
		iEyeIntervalRef2 = null;
	};

	// ----------------- RESUME -----------------
	// To be used when user has manually stopped the video, 
	// then iEye needs to be resumed once video is manually resumed
	ieyewidget.resumeiEye = function() {
			// set the cold start values after pausing
			var i;
			for (i=0; i<itemsInStream; i++) {
				streamTjs = "1" + streamTjs; 
				streamFoc = "1" + streamFoc;
				streamMou = "1" + streamMou;
				streamVis = "1" + streamVis;
			}
			//if paused, need to trim
			if ( streamTjs.length > itemsInStream) streamTjs = streamTjs.substr(0, itemsInStream);
			if ( streamFoc.length > itemsInStream) streamFoc = streamFoc.substr(0, itemsInStream);
			if ( streamVis.length > itemsInStream) streamVis = streamVis.substr(0, itemsInStream);
			if ( streamMou.length > itemsInStream) streamMou = streamMou.substr(0, itemsInStream);
			
			// restart collecting metrics by set interval
			iEyeIntervalRef = (iEyeIntervalRef === null) ?  setInterval(collectMetrics, iEyeIntervalMs) : iEyeIntervalRef;
			iEyeIntervalRef2 = (iEyeIntervalRef2 === null) ? setInterval(handleDecision, iEyeIntervalMs2) : iEyeIntervalRef2;
	};

	// ----------------- STOP ----------------- 
	ieyewidget.stopiEye = function() {
		trackerTaskReference.stop(); // Stops the tracking
		if (localstream) {
			// NOTE: check added in case there is no feed
			localstream.getTracks()[0].stop();
		}
		try{
			document.body.removeChild(iEyeVideoFeed);
			if(document.getElementById('overlay-trackerjs')) {			// if overlay used, remove it
				var item = document.getElementById("overlay-trackerjs");
				//item.parentNode.removeChild(item);
			}			
		}
		catch(err) {
			console.log("ERR " + err.message);
		}
		
		clearInterval(iEyeIntervalRef); 
		iEyeIntervalRef = null;
		clearInterval(iEyeIntervalRef2);
		iEyeIntervalRef2 = null;
	};


	/**
	 * ----------------- Checks whether client browser fits the needs -----------------
	 * Depends on the clientjs library: https://clientjs.org,
	 * which must be included beforehand
	 * ---> the library is faulty, cannot use 
	 */
	function preflightCheck() {
		var client = new ClientJS();
		var checkOK = false;

		if (window.location.protocol.substr(0,5) == "https" || window.location.hostname == "localhost") {		// tjs and intellieye run on https only
			if( !client.isMobile() ) { // Check For Mobile Device; mobile is not fit
				console.log("NOT MOBILE");
				if (
						( client.isOpera() && client.getBrowserMajorVersion() >= 40 ) 	||
						( client.getBrowser() == 'Edge' && client.getBrowserMajorVersion() >= 12 )		||
						( client.isFirefox() && client.getBrowserMajorVersion() >= 36 )		||
						( client.isChrome() && client.getBrowserMajorVersion() >= 53 )		||
						( client.isSafari() && client.getBrowserMajorVersion() >= 11 && !client.isMobileSafari() ) 
																													) {
						checkOK = true;
				}
				else if (client.isIE())	{
					alert("IntelliEye does not support use of Internet Explorer! It is advised to use the latest of Edge, Firefox, Chrome, or Opera web browser for the IntelliEye.");
					preflightNote = "IntelliEye does not support use of Internet Explorer! It is advised to use the latest of Edge, Firefox, Chrome, or Opera web browser for the IntelliEye.";
				}
			} 
			else {
				preflightNote = "IntelliEye does not support mobile platforms yet. Please use a desktop computer / laptop with the latest of Edge, Firefox, Chrome, or Opera web browser for the IntelliEye.";
			}
		}
		else {
			preflightNote = "HTTPS is needed to use Intellieye!";
			alert("HTTPS is needed to use Intellieye!");
		}
		
		return checkOK;
	}

	/**
	 * ---------VIDEO PLAYER MANIPULATION BELOW ----------
	 */

	// ----------------- Pause video ----------------- 
	function iEyeVideoPause() {
		vcontrol.pauseVideo();
	}

	// ----------------- Resume video ----------------- 
	function iEyeVideoResume() {
		if (vcontrol.getCurrentPlayerState() == "pause") vcontrol.rewindAndPlay(getRewindSeconds());
	}

	/**
	 * --------- Logging functions ----------
	 */	

	ieyewidget.enableMetricsLog = function() {
		logMetricsEnabled = true;
	}

	ieyewidget.disableMetricsLog = function() {
		logMetricsEnabled = false;
	}	

	// public function, called in iew-controller.js when video status changes.
	ieyewidget.updateAndLogMetrics = function() {
		collectMetrics();
		var data = getAllMetrics();
		if (ieyewidget.logMetricsEnabled) {
			IEWLogger.logMetrics(data);
		}
	};

	// TODO: typo! calculateScrore()
	// TODO: defocusDurationTimeMS missing.
	// collect all metrics for server
	function getAllMetrics () {
		return {
			'streamTJS': streamTjs,
			'streamVis': streamVis,
			'streamFoc': streamFoc,
			'streamMou': streamMou,
			'scoreTjs': scoreTjs,
			'scoreTjsMem': JSON.stringify(scoreTjsMem),
			'isVisible': !document.hidden,
			'defocusStartTimeMs': defocusStartTimeMs,
			'trend': getCurrentTrend(),
			'iEyeHasFocus': iEyeHasFocus,
			'pausedByIEye': ieyewidget.pausedByIEye,
			'tjsThresholdDefocus': tjsThresholdDefocus,
			'tjsThresholdFocus': tjsThresholdFocus
		};
	}
}) (window);