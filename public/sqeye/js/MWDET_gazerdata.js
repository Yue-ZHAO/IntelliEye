// =============================================================================
// 
// =============================================================================
// NAIVE BAYES *bayes *naive
// =============================================================================
// 
// =============================================================================
window.NBayes = window.NBayes || (function() {
  var module = {};

  // var RTP = require('RTP');

  /*eslint-disable*/
  var means_import = [[1.09145998082,26.8940420625,961.341463415,220.97262454,203.900406504,19.0223577236,942.319105691,4.13075233762,110.586199745,0.506429736234,112.776422764,-0.37800608464,86.8604788075,0.946471757506,1.48873106523,-86.9717345708,173.832213378,-0.042431888826,42.4299001906,2.89226831015,1405.08319075,395.606513685,331.676312691,28.0107054732,1377.07248528,1.41184103588,275.213220085,4.28676378532,365.93902439,207.216399845,203.389227642,127.079268293,238.859756098,0.967538314036,40.3279958351],[1.09417870806,28.8546023958,1005.25806452,221.985695499,204.795698925,15.8924731183,989.365591398,4.31418776246,114.785027354,0.49967697511,111.357526882,-0.40803208373,86.9276256284,1.5624690886,2.26183118847,-86.869253546,173.796879174,-0.0736646693665,42.805899447,3.21352197951,1317.05717297,355.434676036,297.941129024,24.0335284661,1293.0236445,1.45197497322,249.362820125,4.77635489594,372.22311828,207.6192119,203.813172043,125.36827957,246.85483871,1.08179552763,41.0723653809]]
  
  var calculateProbabilities_import = [[-0.563094052312,[6.13293913288,-0.00846277546528],[0.0213566495972,-697.885030655],[0.00105617139401,-285352.266277],[0.0212959026208,-701.872170498],[0.0326766103227,-298.109714879],[0.00858297623812,-4320.9009106],[0.00106350569252,-281430.064107],[0.207578811375,-7.3872719259],[0.010180993393,-3070.92928592],[3.3701091328,-0.0280260697137],[0.0188687099487,-894.058034331],[0.590229576449,-0.913709606156],[0.108897155234,-26.8421351075],[0.0598858722617,-88.7567452518],[0.0454066043327,-154.387479566],[0.130705563011,-18.6321075753],[0.0802514486822,-49.4247368192],[1.45633172978,-0.150082309367],[0.0701925608859,-64.605270998],[0.114744300508,-24.1761912022],[0.000247379402961,-5201433.53354],[0.000791269851508,-508394.554001],[0.000944738873794,-356637.129379],[0.0072519422773,-6052.592705],[0.000253305017445,-4960923.6436],[0.633149318536,-0.794031697647],[0.00111524010418,-255925.388169],[0.069924897556,-65.1008186271],[0.00437937491066,-16596.8578889],[0.0267069612915,-446.273576508],[0.0308400206197,-334.673101008],[0.021580744459,-683.466579179],[0.00404923260901,-19413.5373704],[0.378542033071,-2.22137513718],[0.0201049672602,-787.486988721]],[-0.842678914531,[6.4905294327,-0.00755596399833],[0.0190510280923,-877.027663923],[0.000980752781634,-330926.106901],[0.018009083725,-981.447093092],[0.0274407085741,-422.726510102],[0.0094414746191,-3570.84062734],[0.000971352947011,-337361.876007],[0.198240733712,-8.09961422587],[0.00983868571817,-3288.33421623],[3.28592904599,-0.029480426658],[0.0184135234083,-938.80702519],[0.617052255827,-0.835999925243],[0.101933951054,-30.6346138856],[0.0571630564827,-97.4135213628],[0.042909978857,-172.875530655],[0.0935547375002,-36.3679279691],[0.064829972569,-75.7353177096],[1.45953230302,-0.149424807303],[0.0662909524597,-72.4338566712],[0.100618403678,-31.4409226013],[0.000490078914305,-1325311.88499],[0.00188735815003,-89359.6554588],[0.00217547204655,-67257.8705176],[0.0182715924593,-953.44869244],[0.00049576817705,-1295068.78185],[0.588124884702,-0.920260997278],[0.00263522839148,-45836.7276948],[0.0671268820635,-70.6410549856],[0.00439888922263,-16449.9308545],[0.0264664914277,-454.419943063],[0.0283654753724,-395.612490417],[0.0219229370932,-662.296792793],[0.00406353229582,-19277.1441884],[0.356590775272,-2.50328282142],[0.0210708007964,-716.948639102]]]  
  
  /*eslint-enable*/

  /**
   * Function the retrieves a prediction with one case.
   *
   * @param {*} currentCase
   * @param {*} mean - Precalculated means of each class trained
   * @param {*} classes - Precalculated value of each class (Prior probability and probability function of each feature)
   * @return {number} class
   */
  function nbGetCurrentClass(currentCase, mean, classes) {
    var maxProbability = 0;
    var predictedClass = -1;
    // console.log(currentCase);
    // going through all precalculated values for the classes
    for (var i = 0; i < classes.length; ++i) {
      var currentProbability = classes[i][0]; // initialize with the prior probability
      for (var j = 1; j < mean[0].length + 1; ++j) {
        // console.log(currentCase[j-1]);
        currentProbability += nbCalculateLogProbability(currentCase[j - 1], mean[i][j - 1], classes[i][j][0], classes[i][j][1]);
        // console.log(currentProbability);
      }
      // console.log(currentProbability);
      currentProbability = Math.exp(currentProbability);
      if (currentProbability >= maxProbability) {
        maxProbability = currentProbability;
        predictedClass = i;
      }
    }
    // console.log(predictedClass);
    return predictedClass;
  }

  /**
   * function that retrieves the probability of the feature given the class.
   * @param {float} value - value of the feature.
   * @param {float} mean - mean of the feature for the given class.
   * @param {float} C1 - precalculated value of (1 / (sqrt(2*pi) * std)).
   * @param {float} C2 - precalculated value of (2 * std^2) for the denominator of the exponential.
   * @return {number} log probability
   */
  function nbCalculateLogProbability(value, mean, C1, C2) {
    // console.log(value + ',' + mean + ',' + C1 + ',' + C2);
    var value = value - mean;
    // return Math.log(C1 * Math.exp((value * value) / C2))
    // console.log(value + ',', mean + ',' + C1 + ',', + C2);
    // console.log(Math.log(C1) + (value * value) / C2);
    return Math.log(C1) + (value * value) / C2;
  }

  /**
   * Predicts the user's focus based on an array of features (dataset).
   * Features are calculated by the module RTP.feature_extraction using the fixation list and saccade list.
   * fixation list is calculated by RTP.fixation_calculation, which takes a saccadelist as input.
   * saccadelist is calculated by RTP.saccade_detection which takes a window of gazer data as input.
   * @param {[]} dataset array of features
   * @return {*} prediction 
   */
  module.nbpredict = function(dataset) {
    if (dataset[0].length === calculateProbabilities_import[0].length) {
      throw new RangeError('the dataset must have the same features as the training set');
    }

    var predictions = new Array(dataset.length);

    for (var i = 0; i < predictions.length; ++i) {
      predictions[i] = nbGetCurrentClass(dataset[i], means_import, calculateProbabilities_import);
    }

    return predictions;
  };

  /**
   * Predicts the user's focus based on a window of gazer data.
   * Outputs prediction [0, 1]
   * @param {[]} wd Window of gazer data
   * @return {*} prediction
   */
  module.predictFromWindow = function(wd) {
    function gazeIsNull(gaze) {
      if (typeof(gaze) === 'undefined' || gaze === null || gaze === 'null') return true;
      if (gaze.GazeX === 'null' || gaze.GazeX === null) return true;
      if (gaze.GazeY === 'null' || gaze.GazeY === null) return true;
      return false;
    }
    
    // check if we have enough data in window
    var firstGaze;
    var firstGazeIndex;
    var lastGaze;
    var numOfGazeBetween = 0;
    for (var i = 0; i < wd.length; i++) {
      var gaze = wd[i];
      if (!gazeIsNull(gaze)) {
        if (!firstGaze) {
          firstGaze = gaze;
          firstGazeIndex = i;
        } else {
          lastGaze = gaze;
        }
      }
    }
    
    // we need the num between firstGaze and wd[wd.length-1]
    // then we use num*0.5 as the filter
    // (wd.length-1) - firstGazeIndex + 1 - 2;
    numOfGazeBetween = (wd.length-1) - firstGazeIndex -1;

    if (typeof firstGaze === 'undefined' || typeof lastGaze === 'undefined') {
      mwdet_logger.logException({
        'videoID': vcontrol.getCurrentPlayerID(),
        'exceptionType': 2,
        'exceptionDescription': 'low/no gaze data',
        'videoTime': vcontrol.getCurrentTime(),
        'videoDuration': vcontrol.getDuration(),
      });    
      ADDTOTEMP({"title": "not enough data", "data": JSON.stringify(wd)});  
      return;
    }

    var timediff = Math.abs((new Date(lastGaze.time)) - (new Date(firstGaze.time)));
    if (timediff < 15000) {
        console.log("prediction: timediff too small");
        mwdet_logger.logException({
          'videoID': vcontrol.getCurrentPlayerID(),
          'exceptionType': 2,
          'exceptionDescription': 'low/no gaze data',
          'videoTime': vcontrol.getCurrentTime(),
          'videoDuration': vcontrol.getDuration(),
        });

        ADDTOTEMP({"title": "time diff too small", "data": JSON.stringify(wd)});
        return;      
    }

    var windowParts = mwdet_preprocessor.windowSplit(wd);
    ADDTOTEMP({"title": "splits from window", "data": JSON.stringify(windowParts)});

    if (_.flatten(windowParts).length < Math.round(numOfGazeBetween * 0.5)) {
      console.log("prediction: not enough valids");
        mwdet_logger.logException({
          'videoID': vcontrol.getCurrentPlayerID(),
          'exceptionType': 2,
          'exceptionDescription': 'low/no gaze data',
          'videoTime': vcontrol.getCurrentTime(),
          'videoDuration': vcontrol.getDuration(),
        });
        ADDTOTEMP({"title": "not enough valids", "data": JSON.stringify(wd)});
        return;      
    }

    var fixcs = [];
    for (var i = 0; i < windowParts.length; i++) {
      var sub_wd = windowParts[i];
      var slist = RTP.saccade_detection(sub_wd);
      var fixc = RTP.fixation_calculation(slist);
      fixcs.push(fixc);
    }
    // console.log(JSON.stringify(fixcs) + " length: " + fixcs.length);
    var fixation_list = _.flatten(_.pluck(fixcs, 'fixation_list'));
    ADDTOTEMP({"title": "fixation list", "data": JSON.stringify(fixation_list)});
    // console.log(JSON.stringify(fixation_list + " length: " + fixation_list.length));
    var saccade_list = _.flatten(_.pluck(fixcs, 'saccade_list'));
    ADDTOTEMP({"title": "saccade list", "data": JSON.stringify(saccade_list)});
    // console.log(JSON.stringify(saccade_list) + " length: " + saccade_list.length);

    var feats = RTP.feature_extraction(fixation_list, saccade_list);
    ADDTOTEMP({"title": "features", "data": JSON.stringify(feats)});
    var featsarr = [];
    featsarr.push(feats);
    var prediction = NBayes.nbpredict(featsarr);
    ADDTOTEMP({"title": "prediction", "data": JSON.stringify(prediction)});
    console.log(prediction);
    return prediction;
  };

  return module;
})();

  //TODO: remove;
  window.ALLOWLOG = false;
  window.TEMPDATALOG = [];
  window.ADDTOTEMP = function(data) {
    if (ALLOWLOG) {
      TEMPDATALOG.push(data);
    }
  };
  window.TEMPDATALOGTAB = function() {
      var newwindow = window.open();
      var body = $(newwindow.document.body);
      $.each(TEMPDATALOG, (i, o) => {
        body.append('<h2>' + o.title + '</h2><br>' + o.data + '<hr><br>');
      });
  };


// =============================================================================
// Data collection *gazerdata
// =============================================================================
/**
 * Collects webgazer's data using a sliding window of size determined in the HTML.
 * The recentGazerData stores 150 most recent points.
 */
window.Gazerdata = window.Gazerdata || (function() {
/* eslint-disable require-jsdoc*/
  var module = {};

  // =========================================================================
  // private
  // =========================================================================
  var window = [];
  var stepContainer = [];

  var pollingStarted = false;

  // how often data is collected (200ms)
  var collectionTime = 200;

  var stepInterval = false;
  var collectionInterval = false;

  var onNewDataWindow;

  function init(callback) {
    onNewDataWindow = callback;
  }

  function updateWindow(step) {
    ADDTOTEMP({"title": "new step data", "data": JSON.stringify(step)});

    window = mwdet_preprocessor.windowFill(window, step);
    ADDTOTEMP({"title": "window fill with step", "data": JSON.stringify(window)});

    // notify callback of new data
    // onNewDataWindow(_.flatten(window));
    onNewDataWindow(window);
  }

  function stopPolling() {
    clearInterval(collectionInterval);
    collectionInterval = false;
    clearInterval(stepInterval);
    stepInterval = false;

    // pollingStarted = false;
  }

  function startPolling() {
    if (!collectionInterval) {
      collectionInterval = setInterval(function() {
        var gazer = webgazer.getCurrentPrediction();
        if (gazer && !Gazer.gazerIsPaused()) {
          gazer = {
            'GazeX': gazer.x,
            'GazeY': gazer.y,
            'time': new Date(),
          };
          stepContainer.push(gazer);
        }
      }, collectionTime);
    }

    if (!stepInterval) {
      stepInterval = setInterval(function() {
        if (stepContainer.length > 1) {
          updateWindow(stepContainer);
          stepContainer = [];
        }
        
      }, MWDET_GAZER_STEP_TIME);
    }
  }

  // =========================================================================
  // public
  // =========================================================================
  module.init = function(callback) {
    console.log('[MWDET] Gazer data collection initialized.');
    init(callback);
  };

  module.stopPolling = function() {
    console.log('[MWDET] Stopped polling gazer data.');
    stopPolling();
  };

  module.startPolling = function() {
    console.log('[MWDET] Start polling for gaze data.');
    startPolling();
  };

  module.getWindow = function() {
    // return _.flatten(window);
    return window;
  };

  return module;
})();
