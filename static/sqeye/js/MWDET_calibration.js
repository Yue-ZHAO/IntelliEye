// =============================================================================
// 
// =============================================================================
// *CALIBRATION
// =============================================================================
// 
// =============================================================================
window.Calibration = window.Calibration || (function() {

  // =========================================================================
  // private
  // =========================================================================
  var module = {};
  var onFinishCalibration;

  /*
    * Calibration parameters:
    * To change the calibration screen,
    * edit these parameters below:
    * (might require a bit of trial and error to get it just right)
    * i.e. for 40 buttons you can try 8x5, 5x8, 4x10, 10x4
    * the closer the 2 numbers are to each other, the better since then they're distributed more evenly.
    * 8x5 is in this case better since width > height; 8 and 5 are closer to each other than 4 and 10.
    */
  // size of buttons
  var button_size = 9;
  // determines how much padding there is from the edges to the nodes
  var padding = 5;
  // number of horizontal nodes
  var gameNodes_h = 4;
  // number of vertical nodes
  var gameNodes_v = 3;

  // list containing all the buttons
  var listOfIds = [];

  // calibration data to send to the server
  var calibrationData = [];
  var estimationData = [];

  /**
   * Initializes the buttons on the screen
   * The number of nodes can be modified using the gameNodes_h and gameNodes_v parameters.
   * The nodes are divided evenly on the screen.
   */
  function initGame(callback) {

    // Calculate the available space between the buttons.
    // rest: # pixels available to use
    // space: space between buttons
    var rest_h = $('#calibrationOverlay').width() - (gameNodes_h * button_size);
    var rest_v = $('#calibrationOverlay').height() - (gameNodes_v * button_size);
    var space_h = (rest_h) / (gameNodes_h - 1);
    var space_v = (rest_v) / (gameNodes_v - 1);
    var number = 0;

    // this determines which button should be displayed first
    var randStart = parseInt(Math.random() * gameNodes_h * gameNodes_v + 1);
    for (var i_width = 0; i_width < gameNodes_h; i_width++) {
      var bspace_h = (i_width === 0 || i_width === gameNodes_h) ? padding * 2.2 : (space_h * i_width) + padding;
      for (var i_height = 0; i_height < gameNodes_v; i_height++) {
        var bspace_v = (i_height === 0 || i_height === gameNodes_v) ? padding * 2.2 : (space_v * i_height) + padding;
        number++;
        var bId = 'calibration-btn-' + number;

        // button creation:
        var b = $('<button/>', {
          text: '',
          click: function (e) {
            $(this).hide(); clickedButton(e)
          },
          id: bId,
          class: 'cal-button boxshadow',
          style: 'top:' + parseInt($("#calibrationOverlay").position().top + bspace_v) +
          'px;left:' + parseInt($("#calibrationOverlay").position().left + bspace_h) + 'px' +
          ';height:' + button_size + 'px;' + 'width:' + button_size + 'px'
        });

        // show the middle node, hide the rest in the list
        if (number === randStart) {
          $(b).css({
            'display': 'block'
          });
          $(b).bind('click', function () {
            $('#cal-info').fadeOut();
          });
        }
        listOfIds.push(bId);

        $("#calibrationOverlay").append(b);
      }
    }
    shuffle(listOfIds); // shuffles the buttons so random buttons pop up one by one
  }

  /**
   * A generic shuffle method, takes an array and outputs a shuffled array.
   * @param array Array to shuffle.
   * @returns {*} The shuffled array.
   */
  function shuffle(array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  /**
   * When a button is clicked,
   * another will be shown until there is no more left in the array
   * When array is empty, video will be loaded.
   * loadYoutube() is a function in the file video.js
   * When a calibration button is clicked,
   * The user's mouse data is stored together with the webgazer's prediction.
   * This is then sent to the server.
   */
  function clickedButton(e) {
    // WHEN DONE:
    if (listOfIds.length !== 0) {
      // each calibration button is popped out of the list one-by-one.
      // it is set to fade in.
      $('#' + listOfIds.pop()).show();
    } else {
      // =================================================================
      // Finished calibration
      // =================================================================
      $('.MWDET-container').hide();
      onFinishCalibration();
    }

    if ($("#cal-info").is(":visible")) {
      $("#cal-info").fadeOut();
    }

    //hide progress after click
    $('#cal-progress').hide();
  }

  function setOnFinishCalibration(callback) {
    onFinishCalibration = callback;
  }

  /**
   * When the user hovers on a calibration button,
   * progress is shown.
   */
  $('.cal-button').hover(function () {
    // empty progress div and append the new progress text
    $('#cal-progress').empty()
      .append(gameNodes_h * gameNodes_v - listOfIds.length + '/' + gameNodes_h * gameNodes_v);
    $('#cal-progress').show();
    // realign the progress div
    $('#cal-progress').css('top', $(this).position().top - button_size * .8);
    $('#cal-progress').css('left', $(this).position().left);
  }, function () {
    // when user hovers away, hide div.
    $('#cal-progress').hide();
  });

  // =========================================================================
  // public
  // =========================================================================
  module.initCalibration = function (callback) {
    initGame(callback);
    $("#cal-info").append("Please click on the blue dots for calibration.");
    setOnFinishCalibration(callback);
  }
  return module;
})();
