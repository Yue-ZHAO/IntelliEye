/*eslint-disable*/
/**
 * Real time processing of gaze data.
 * Translated from Yue's python code.
 */

var RTP = {};

// work around to use numjs Node dependency locally.
// this file will be translated using Browserify which
// wraps this file together with the Node dependencies into a new bundle.
// RTP.np = require('numjs');

// =============================================================================
// KURTOSIS
// =============================================================================
/**
*
*	COMPUTE: kurtosis
*
*
*	DESCRIPTION:
*		- Computes the sample excess kurtosis of an array of values.
*
*
*	NOTES:
*		[1] 
*
*
*	TODO:
*		[1] 
*
*
*	LICENSE:
*		MIT
*
*	Copyright (c) 2014. Athan Reines.
*
*
*	AUTHOR:
*		Athan Reines. kgryte@gmail.com. 2014.
*
*/
RTP.kurtosis = function(arr) {
		if ( !Array.isArray( arr ) ) {
			throw new TypeError( 'kurtosis()::invalid input argument. Must provide an array.' );
		}
		var len = arr.length,
			delta = 0,
			delta_n = 0,
			delta_n2 = 0,
			term1 = 0,
			N = 0,
			mean = 0,
			M2 = 0,
			M3 = 0,
			M4 = 0,
			g;

		for ( var i = 0; i < len; i++ ) {
			N += 1;

			delta = arr[ i ] - mean;
			delta_n = delta / N;
			delta_n2 = delta_n * delta_n;

			term1 = delta * delta_n * (N-1);

			M4 += term1*delta_n2*(N*N - 3*N + 3) + 6*delta_n2*M2 - 4*delta_n*M3;
			M3 += term1*delta_n*(N-2) - 3*delta_n*M2;
			M2 += term1;
			mean += delta_n;
		}
		// Calculate the population excess kurtosis:
		g = N*M4 / ( M2*M2 ) - 3;
		// Return the corrected sample excess kurtosis:
        return (N-1) / ( (N-2)*(N-3) ) * ( (N+1)*g + 6 );
}

// =============================================================================
// SKEWNESS
// =============================================================================
/**
 * License

    MIT license.

    Copyright

    Copyright © 2014. Athan Reines.
 */
RTP.skewness = function( arr ) {
        if ( !Array.isArray( arr ) ) {
            throw new TypeError( 'skewness()::invalid input argument. Must provide an array.' );
        }
        var len = arr.length,
            delta = 0,
            delta_n = 0,
            term1 = 0,
            N = 0,
            mean = 0,
            M2 = 0,
            M3 = 0,
            g;

        for ( var i = 0; i < len; i++ ) {
            N += 1;

            delta = arr[ i ] - mean;
            delta_n = delta / N;

            term1 = delta * delta_n * (N-1);

            M3 += term1*delta_n*(N-2) - 3*delta_n*M2;
            M2 += term1;
            mean += delta_n;
        }
        // Calculate the population skewness:
        g = Math.sqrt( N )*M3 / Math.pow( M2, 3/2 );

        // Return the corrected sample skewness:
        return Math.sqrt( N*(N-1))*g / (N-2);
}

// =============================================================================
// PROCESSING
// =============================================================================
/**
 * Function: array filter
 * Usage: convolution filter for time series data (stat::filter in R)
 * Input: original array, parameters for filtering
 * Output: filtered array
 * PS: In our application, we only filter parameters with 3 values
 */
RTP.array_filter = function (input_array, filter_parameter) {

    // // ONLY FOR TESTING:
    // // The input comes from python which stringifies everything.
    // // So parse is needed.
    // input_array = JSON.parse(input_array);
    // filter_parameter = JSON.parse(filter_parameter);
    // // ONLY FOR TESTING

    // define output array and make it empty
    var output_array = [];
    for (var i = 0; i < input_array.length; i++) {
        if (i === 0) {
            output_array.push(0);
        } else if (i === input_array.length - 1) {
            output_array.push(0);
        } else {
            var filter_value = (filter_parameter[2] * input_array[i - 1] + filter_parameter[1] * input_array[i] + filter_parameter[0] * input_array[i + 1]);
            output_array.push(filter_value);
        }
    }
    return output_array;
};

/**
 * Function: Saccade detection
 * Usage: it is used to tag each gaze point whether there is a saccade between current gaze point and previous gaze point
 * Input: array of JSON objects
 * Output boolean array saccade_array
 * @param {*} Gaze_array array of JSON objects
 */
RTP.saccade_detection = function (Gaze_array) {
    // TESTING ONLY:
    // PARSE INPUT
    // Gaze_array = JSON.parse(Gaze_array);
    // TESTING ONLY

    var gazeX_array = [];
    var gazeY_array = [];

    // read GazeX and GazeY from gaze array
    for (var i in Gaze_array) {
        var d = Gaze_array[i];
        if ('GazeX' in d && 'GazeY' in d) {
            gazeX_array.push(d.GazeX);
            gazeY_array.push(d.GazeY);
        }
    }

    var vx = RTP.array_filter(gazeX_array, [-0.5, 0, 0.5]);
    var vy = RTP.array_filter(gazeY_array, [-0.5, 0, 0.5]);

    vx[0] = vx[1];
    vx[vx.length - 1] = vx[vx.length - 2];
    vy[0] = vy[1];
    vy[vy.length - 1] = vy[vy.length - 2];

    var vx_2 = [];
    var vy_2 = [];

    for (var i in vx)
        vx_2.push(Math.pow(vx[i], 2));

    for (var i in vy) {
        vy_2.push(Math.pow(vy[i], 2));
    }

    var msdx = Math.sqrt(math.median(vx_2) - Math.pow(math.median(vx), 2));
    var msdy = Math.sqrt(math.median(vy_2) - Math.pow(math.median(vy), 2));

    // Detection thresholds were computed independently for horizontal gx and vertical gy components
    // In our pilot study, the model is selected by data with lambda = 1
    var lamb = 1;
    var radiusx = msdx * lamb;
    var radiusy = msdy * lamb;

    var sacc = [];
    for (var i in vx) {
        var m1 = Math.pow(vx[i] / radiusx, 2);
        var m2 = Math.pow(vy[i] / radiusy, 2);
        sacc.push((m1 + m2) > 1);
    }

    sacc = RTP.array_filter(sacc, [1.0 / 3, 1.0 / 3, 1.0 / 3]);

    for (var i in sacc)
        sacc[i] = Math.round(sacc[i]);

    var temp_index = 0
    for (var i in Gaze_array) {
        var gaze = Gaze_array[i];
        if ('GazeX' in gaze && 'GazeY' in gaze) {
            gaze.vx = vx[temp_index];
            gaze.vy = vy[temp_index];
            gaze.sacc = sacc[temp_index];
            temp_index = temp_index + 1;
        }
    }

    return Gaze_array;
};

// Function: Fixation calculation
// Usage: it is used for calculate the average fixation coordinate, the duration and the angles of fixations
// Input: the array of gaze which is processed by saccade_detection
// Output: the array of gaze with fixation information
// PS 0: in this function, we calculate the x, y, duration and angles of each fixations.
//       Except for the initialization, fixation starts from a gaze point whose sacc is True.
//       It means that before this gaze point, there is a saccade
//       The average coordinate X, Y of gazes in the same fixation are treated as fixation X and Y
//       The duration of gazes in the same fixation is calculated as the gap between the start time and end time of the fixation
//       If there is only one gaze point in the fixation, duration is calculated as the gap between the time of the current gaze point and the previous gaze point.
//       The angle is calculated by coordinates of current fixation and previous fixation
// PS 1: in Javascript, how can we save the output results? Matrix? or an array of dictionary?
// PS 2: the angle refers to the angle between the saccade line (from previous fixation point to current fixation point) and the horizontal line.
RTP.fixation_calculation = function (Gaze_array) {
    function rad2deg(rad) {
        return parseFloat(rad * 180) / (Math.PI);
    }

    var fixation_list = [];
    var saccade_list = [];

    var temp_gazex_sum = 0;
    var temp_gazey_sum = 0;
    var temp_nsample = 0;
    var temp_starttime_previous_fixation = 0;
    var temp_endtime_previous_fixation = 0;
    var temp_starttime_current_fixation = 0;
    var temp_endtime_current_fixation = 0;

    var temp_fixationX = 0;
    var temp_fixationY = 0;

    var start_flag_gaze = true;
    var num_gaze = 0;
    var start_flag_fixation = true;

    var fixationX = 0;
    var fixationY = 0;
    var duration = 0;
    var angle = 0;
    var distance = 0;

    for (var i in Gaze_array) {
        var gaze = Gaze_array[i];
        // console.log("time: " + gaze["time"]);
        if ("sacc" in gaze) {
            if (start_flag_gaze) { // initialization
                start_flag_gaze = false;

                temp_nsample = 1;
                temp_gazex_sum = gaze.GazeX;
                temp_gazey_sum = gaze.GazeY;
                temp_starttime_previous_fixation = gaze.time;
                temp_endtime_previous_fixation = gaze.time;
                temp_starttime_current_fixation = gaze.time;
                temp_endtime_current_fixation = gaze.time;
                
            } else { // processing
                if (gaze.sacc) { // new fixation
                    // calculate previous fixation
                    if (temp_nsample !== 0) {
                        fixationX = parseFloat(temp_gazex_sum) / temp_nsample;
                        fixationY = parseFloat(temp_gazey_sum) / temp_nsample;
                        // console.log(temp_endtime_current_fixation - temp_starttime_current_fixation);
                        duration = temp_endtime_current_fixation - temp_starttime_current_fixation;
                        if (duration === 0)
                            duration = temp_endtime_current_fixation - temp_endtime_previous_fixation;

                        angle = 0;
                        distance = 0;

                        if (!start_flag_fixation) {
                            angle = rad2deg(math.atan((fixationY - temp_fixationY) / (fixationX - temp_fixationX)));
                            distance = math.sqrt(math.pow((fixationY - temp_fixationY), 2) +
                                math.pow((fixationX - temp_fixationX), 2));
                        }

                        start_flag_fixation = false;

                        fixation_list.push({
                            "FixationX": fixationX,
                            "FixationY": fixationY,
                            "Duration": duration,
                            "Angle": angle,
                            "Distance": distance
                        });

                        // Until now, we already deal with the fixation.
                        // Currently we deal with the gaze point which follows the current fixation
                        // not saccade_time = temp_starttime_current_fixation - temp_endtime_previous_fixation
                        // Since we are processing the gaze point next to current fixation
                        var saccade_time = gaze.time - temp_endtime_current_fixation;
                        // console.log(gaze["time"] + "\t" + temp_endtime_current_fixation);
                        saccade_list.push(saccade_time);
                    }
                    // start new calculation
                    temp_nsample = 1;
                    temp_gazex_sum = gaze.GazeX;
                    temp_gazey_sum = gaze.GazeY;
                    temp_starttime_previous_fixation = temp_starttime_current_fixation;
                    temp_endtime_previous_fixation = temp_endtime_current_fixation;
                    temp_starttime_current_fixation = gaze.time;
                    temp_endtime_current_fixation = gaze.time;
                    temp_fixationX = fixationX;
                    temp_fixationY = fixationY;
                } else { // gaze point is in the same fixation with previous gaze point
                    // add values to current fixation
                    temp_gazex_sum = temp_gazex_sum + gaze.GazeX;
                    temp_gazey_sum = temp_gazey_sum + gaze.GazeY;
                    temp_nsample = temp_nsample + 1;
                    temp_endtime_current_fixation = gaze.time;
                }
            }
        }
        num_gaze = num_gaze + 1;

        // process the last gaze point
        if (num_gaze === _.size(Gaze_array)) {
            if (temp_nsample !== 0) {
                fixationX = parseFloat(temp_gazex_sum) / temp_nsample;
                fixationY = parseFloat(temp_gazey_sum) / temp_nsample;
                duration = temp_endtime_current_fixation - temp_starttime_current_fixation;
                if (duration === 0)
                    duration = temp_endtime_current_fixation - temp_endtime_previous_fixation;

                angle = rad2deg(math.atan((fixationY - temp_fixationY) / (fixationX - temp_fixationX)));
                distance = math.sqrt(math.pow((fixationY - temp_fixationY), 2) +
                    math.pow((fixationX - temp_fixationX), 2));

                fixation_list.push({
                    "FixationX": fixationX,
                    "FixationY": fixationY,
                    "Duration": duration,
                    "Angle": angle,
                    "Distance": distance
                });
            }
        }
    }
    return {
        "fixation_list": fixation_list,
        "saccade_list": saccade_list
    };
};

RTP.feature_extraction = function (fixation_array, saccade_list, mode, pos_subtitle, pos_face, pos_slide) {
    mode = typeof mode !== "undefined" ? mode : "Global";
    pos_subtitle = typeof pos_subtitle !== "undefined" ? pos_subtitle : [0, 0, 0, 0];
    pos_face = typeof pos_face !== "undefined" ? pos_face : [0, 0, 0, 0];
    pos_slide = typeof pos_slide !== "undefined" ? pos_slide : [0, 0, 0, 0];

    var feature_fixation_saccade_ratio;
    var feature_fixation_duration;
    var feature_saccade_horizonratio;
    var feature_saccade_num;
    var feature_saccade_angle;
    var feature_saccade_distance;
    var feature_saccade_duration;
    var feature_saccade_aoi;
    var feature_fixation_aoi;

    // Extract global features from the array of fixations

    if (mode === "Global" || mode === "Mix") {
        var fixation_duration = _.pluck(fixation_array, "Duration");
        var saccade_angle = _.pluck(fixation_array, "Angle");
        var saccade_distance = _.pluck(fixation_array, "Distance");

        // Since the first distance value is set as 0 in this code
        // and in previous work we consider the distance between the first fixation and previous (null)
        saccade_distance = saccade_distance.slice(1, saccade_distance.length);
        var saccade_duration = saccade_list;

        feature_fixation_saccade_ratio = parseFloat(math.sum(fixation_duration)) / math.sum(saccade_duration);
        feature_fixation_duration = [RTP.kurtosis(fixation_duration),
        math.max(fixation_duration),
        math.mean(fixation_duration),
        math.median(fixation_duration),
        math.min(fixation_duration),
        math.max(fixation_duration) - math.min(fixation_duration),
        RTP.skewness(fixation_duration),
        math.std(fixation_duration)];

        // console.log(saccade_angle);
        // console.log(_.map(saccade_angle, function (i) { if ((i <= 30 && i >= -30) || (i >= 150 && i <= 210) || (i >= 330)) return 1; else return 0;}));


        var num_saccade_horizon = math.sum(_.map(saccade_angle, function (i) { if ((i <= 30 && i >= -30) || (i >= 150 && i <= 210) || (i >= 330)) return 1; else return 0; }));
        feature_saccade_horizonratio = parseFloat(num_saccade_horizon) / saccade_angle.length;
        feature_saccade_num = saccade_duration.length;

        feature_saccade_angle = [RTP.kurtosis(saccade_angle),
        math.max(saccade_angle),
        math.mean(saccade_angle),
        math.median(saccade_angle),
        math.min(saccade_angle),
        math.max(saccade_angle) - math.min(saccade_angle),
        RTP.skewness(saccade_angle),
        math.std(saccade_angle)];

        feature_saccade_distance = [RTP.kurtosis(saccade_distance),
        math.max(saccade_distance),
        math.mean(saccade_distance),
        math.median(saccade_distance),
        math.min(saccade_distance),
        math.max(saccade_distance) - math.min(saccade_distance),
        RTP.skewness(saccade_distance),
        math.std(saccade_distance)];

        feature_saccade_duration = [RTP.kurtosis(saccade_duration),
        math.max(saccade_duration),
        math.mean(saccade_duration),
        math.median(saccade_duration),
        math.min(saccade_duration),
        math.max(saccade_duration) - math.min(saccade_duration),
        RTP.skewness(saccade_duration),
        math.std(saccade_duration)];


        // Extract the local features from the array of fixations and the AOIs
        // Please Notice that the most efficient way is
        // to combine the global feature extraction and local feature extraction
        // in a single for loop.
        // Here, I write them seprerately since it is more readable.
    }

    if (mode === "Local" || mode === "Mix") {
        function isinaoi(fixation_x, fixation_y) {
            // pos[0] means top left x, pos[1] means top left y
            // pos[2] means bottom right x, pos[3] means bottom right y
            if ((fixation_x >= pos_face[0] && fixation_x <= pos_face[2]) &&
                (fixation_y >= pos_face[1] && fixation_y <= pos_face[3])) {
                return "face";
            } else if ((fixation_x >= pos_subtitle[0] && fixation_x <= pos_subtitle[2]) &&
                (fixation_y >= pos_subtitle[1] && fixation_y <= pos_subtitle[3])) {
                return "subtitle";
            } else if ((fixation_x >= pos_slide[0] && fixation_x <= pos_slide[2]) &&
                (fixation_y >= pos_slide[1] && fixation_y <= pos_slide[3])) {
                return "slide";
            } else {
                return "out";
            }
        }

        // num of saccade jump from one area to another
        var num_saccade_aoi_face_out2in = 0;
        var num_saccade_aoi_face_aoi2in = 0;
        var num_saccade_aoi_face_in2out = 0;
        var num_saccade_aoi_face_in2aoi = 0;
        var num_saccade_aoi_face_within = 0;

        var num_saccade_aoi_slide_out2in = 0;
        var num_saccade_aoi_slide_aoi2in = 0;
        var num_saccade_aoi_slide_in2out = 0;
        var num_saccade_aoi_slide_in2aoi = 0;
        var num_saccade_aoi_slide_within = 0;

        var num_saccade_aoi_subtitle_out2in = 0;
        var num_saccade_aoi_subtitle_aoi2in = 0;
        var num_saccade_aoi_subtitle_in2out = 0;
        var num_saccade_aoi_subtitle_in2aoi = 0;
        var num_saccade_aoi_subtitle_within = 0;

        var temp_aoi = "out";

        // numbers and durations of fixations in AOIs and out of AOIs.
        var list_duration_fixation_aoi_face = [];
        var list_duration_fixation_aoi_subtitle = [];
        var list_duration_fixation_aoi_slide = [];
        var list_duration_fixation_aoi_out = [];

        var start_flag_fixation = true;

        for (var i in fixation_array) {
            var fixation = fixation_array[i];

            var current_aoi = isinaoi(fixation.FixationX, fixation.FixationY);

            if (start_flag_fixation) {
                switch (current_aoi) {
                    case "face": list_duration_fixation_aoi_face.push(fixation.Duration); break;
                    case "subtitle": list_duration_fixation_aoi_subtitle.push(fixation.Duration); break;
                    case "slide": list_duration_fixation_aoi_slide.push(fixation.Duration); break;
                    default: list_duration_fixation_aoi_out.push(fixation.Duration); break;
                }
                temp_aoi = current_aoi;
                start_flag_fixation = false;
            } else {
                if (current_aoi === "face") {
                    list_duration_fixation_aoi_face.push(fixation.Duration);
                    switch (temp_aoi) {
                        case "face": num_saccade_aoi_face_within += 1; break;
                        case "out": num_saccade_aoi_face_out2in += 1; break;
                        default:
                            num_saccade_aoi_face_aoi2in += 1;
                            if (temp_aoi === "slide") {
                                num_saccade_aoi_slide_in2aoi += 1;
                            } else {
                                num_saccade_aoi_subtitle_in2aoi += 1;
                            }
                    }
                } else if (current_aoi === "subtitle") {
                    list_duration_fixation_aoi_subtitle.push(fixation.Duration);
                    switch (temp_aoi) {
                        case "subtitle": num_saccade_aoi_subtitle_within += 1; break;
                        case "out": num_saccade_aoi_subtitle_out2in += 1; break;
                        default:
                            num_saccade_aoi_subtitle_aoi2in += 1;
                            if (temp_aoi === "face") {
                                num_saccade_aoi_face_in2aoi += 1;
                            } else {
                                num_saccade_aoi_slide_in2aoi += 1;
                            }
                    }
                } else if (current_aoi === "slide") {
                    list_duration_fixation_aoi_slide.push(fixation.Duration);
                    switch (temp_aoi) {
                        case "slide": num_saccade_aoi_slide_within += 1; break;
                        case "out": num_saccade_aoi_slide_out2in += 1; break;
                        default:
                            num_saccade_aoi_slide_aoi2in += 1;
                            if (temp_aoi === "face") {
                                num_saccade_aoi_face_in2aoi += 1;
                            } else {
                                num_saccade_aoi_subtitle_in2aoi += 1;
                            }
                    }
                } else {
                    // console.log(">> dur:" + JSON.stringify(fixation));
                    list_duration_fixation_aoi_out.push(fixation.Duration);
                    switch (temp_aoi) {
                        case "slide": num_saccade_aoi_slide_in2out += 1; break;
                        case "face": num_saccade_aoi_face_in2out += 1; break;
                        case "subtitle": num_saccade_aoi_subtitle_in2out += 1; break;
                        default: //none
                    }
                }

                temp_aoi = current_aoi;
            }
        }

        // console.log(">> " + fixation_array.length);

        // console.log(fixation_array);

        // local feature extraction
        var duration_fixation_aoi_face = 0;
        var duration_fixation_aoi_face_max = 0;
        var duration_fixation_aoi_subtitle = 0;
        var duration_fixation_aoi_subtitle_max = 0;
        var duration_fixation_aoi_slide = 0;
        var duration_fixation_aoi_slide_max = 0;
        var duration_fixation_aoi_out = 0;
        var duration_fixation_aoi_out_max = 0;

        if (list_duration_fixation_aoi_face.length !== 0) {
            duration_fixation_aoi_face = math.sum(list_duration_fixation_aoi_face) / math.sum(fixation_duration);
            duration_fixation_aoi_face_max = math.max(list_duration_fixation_aoi_face);
        }
        if (list_duration_fixation_aoi_subtitle.length !== 0) {
            duration_fixation_aoi_subtitle = math.sum(list_duration_fixation_aoi_subtitle) / math.sum(fixation_duration);
            duration_fixation_aoi_subtitle_max = math.max(list_duration_fixation_aoi_subtitle);
        }
        if (list_duration_fixation_aoi_slide.length !== 0) {
            duration_fixation_aoi_slide = math.sum(list_duration_fixation_aoi_slide) / math.sum(fixation_duration);
            duration_fixation_aoi_slide_max = math.max(list_duration_fixation_aoi_slide);
        }
        if (list_duration_fixation_aoi_out.length !== 0) {
            // console.log(">>" + math.sum(list_duration_fixation_aoi_out))
            // console.log(">>" + math.sum(fixation_duration))
            // console.log(">>" + math.sum(list_duration_fixation_aoi_out) / math.sum(fixation_duration));

            duration_fixation_aoi_out = math.sum(list_duration_fixation_aoi_out) / math.sum(fixation_duration);
            duration_fixation_aoi_out_max = math.max(list_duration_fixation_aoi_out);
        }

        // console.log(">>" + list_duration_fixation_aoi_out);

        feature_fixation_aoi = [duration_fixation_aoi_face,
            duration_fixation_aoi_face_max,
            duration_fixation_aoi_out,
            duration_fixation_aoi_out_max,
            duration_fixation_aoi_slide,
            duration_fixation_aoi_slide_max,
            duration_fixation_aoi_subtitle,
            duration_fixation_aoi_subtitle_max];

        // console.log(">>dfao"  + duration_fixation_aoi_out);

        feature_saccade_aoi = [parseFloat(num_saccade_aoi_face_aoi2in) / saccade_duration.length,
        parseFloat(num_saccade_aoi_face_in2aoi) / saccade_duration.length,
        parseFloat(num_saccade_aoi_face_in2out) / saccade_duration.length,
        parseFloat(num_saccade_aoi_face_out2in) / saccade_duration.length,
        parseFloat(num_saccade_aoi_face_within) / saccade_duration.length,
        parseFloat(num_saccade_aoi_slide_aoi2in) / saccade_duration.length,
        parseFloat(num_saccade_aoi_slide_in2aoi) / saccade_duration.length,
        parseFloat(num_saccade_aoi_slide_in2out) / saccade_duration.length,
        parseFloat(num_saccade_aoi_slide_out2in) / saccade_duration.length,
        parseFloat(num_saccade_aoi_slide_within) / saccade_duration.length,
        parseFloat(num_saccade_aoi_subtitle_aoi2in) / saccade_duration.length,
        parseFloat(num_saccade_aoi_subtitle_in2aoi) / saccade_duration.length,
        parseFloat(num_saccade_aoi_subtitle_in2out) / saccade_duration.length,
        parseFloat(num_saccade_aoi_subtitle_out2in) / saccade_duration.length,
        parseFloat(num_saccade_aoi_subtitle_within) / saccade_duration.length];
    }    

    // Combine features and return results
    // We need to combine features as the order of features in previous model training
    if (mode === "Global") {
        var featurelist_global = [feature_fixation_saccade_ratio,
            feature_fixation_duration,
            feature_saccade_horizonratio,
            feature_saccade_num,
            feature_saccade_angle,
            feature_saccade_distance,
            feature_saccade_duration
        ];
        return _.flatten(featurelist_global);
    } else if (mode === "Local") {
        var featurelist_local = [feature_fixation_aoi, feature_saccade_aoi];
        return _.flatten(featurelist_local);
    } else {
        var featurelist_mix = [feature_fixation_aoi,
            feature_fixation_saccade_ratio,
            feature_fixation_duration,
            feature_saccade_aoi,
            feature_saccade_horizonratio,
            feature_saccade_num,
            feature_saccade_angle,
            feature_saccade_distance,
            feature_saccade_duration
        ];
        return _.flatten(featurelist_mix);
    }
};


// =============================================================================
// Testing
// =============================================================================

var getColumn = function (array, header) {
    var res = [];
    for (var row = 1; row < array.length; row++) {
        for (var col = 0; col < array[row].length; col++) {
            if (array[0][col] === header)
                res.push(array[row][col]);
        }
    }
    return res;
};

RTP.test_filter = function (bench_filepath) {
    $.get(bench_filepath, function (data) {
        var dataframe = $.csv.toObjects(data);

        var vx_test = RTP.array_filter(_.pluck(dataframe, "GazeX_s_px"), [-0.5, 0, 0.5]);
        var vy_test = RTP.array_filter(_.pluck(dataframe, "GazeY_s_px"), [-0.5, 0, 0.5]);


        vx_test[0] = vx_test[1];
        vx_test[vx_test.length - 1] = vx_test[vx_test.length - 2];
        vy_test[0] = vy_test[1];
        vy_test[vy_test.length - 1] = vy_test[vy_test.length - 2];

        // get the bench
        var vx_r = _.pluck(dataframe, "vx");
        var vy_r = _.pluck(dataframe, "vy");

        //convert all values to floats (read as strings)
        vx_r = _.map(vx_r, function (value) { return parseFloat(value); });
        vy_r = _.map(vy_r, function (value) { return parseFloat(value); });

        // compare
        if (_.isEqual(vx_test, vx_r))
            console.log("vx same");
        else
            console.log("vx different");

        if (_.isEqual(vy_test, vy_r))
            console.log("vy same");
        else
            console.log("vy different");
    }, 'text');
};

RTP.test_saccade = function (bench_filepath) {
    $.get(bench_filepath, function (data) {
        var dataframe = $.csv.toObjects(data);

        // select columns and rename columns.
        var list_bench = _.map(dataframe, function (row) {
            return {
                "Timestamp_utc": row.Timestamp_utc,
                "GazeX": parseInt(row.GazeX_s_px),
                "GazeY": parseInt(row.GazeY_s_px),
                "saccade": $.parseJSON(row.saccade.toLowerCase())
            };
        });

        list_bench = RTP.saccade_detection(list_bench);

        // convert 1's and 0's to TRUE's and FALSE's
        var saccade_test = _.map(list_bench, function (row) {
            return row.sacc === 1 ? "TRUE" : "FALSE";
        });

        var saccade_r = _.pluck(dataframe, "saccade");

        // compare
        if (_.isEqual(saccade_test, saccade_r))
            console.log("saccade correct");
        else
            console.log("saccade different");

    }, 'text');
};

RTP.test_fixation = function (bench_filepath) {
    // moment().format('MMMM Do YYYY, h:mm:ss a'); // May 28th 2017, 10:16:01 pm

    $.get(bench_filepath, function (data) {
        function time_trans(curtime_string, mintime_string) {
            var curtime = new Date(curtime_string);
            var mintime = new Date(mintime_string);
            var gap = (curtime.getTime() - mintime.getTime()).toFixed(1);
            return gap;
        }

        function findMinTime(array) {
            // array of utc times
            var tmoments = _.map(array, function (timestr) {
                return moment(timestr);
            });
            return moment.min(tmoments);
        }

        function uniqueObjects(arrayOfObj) {
            return _.chain(arrayOfObj)
                .map(function (obj) {
                    return JSON.stringify(obj);
                }).uniq().map(function (stringified) {
                    return JSON.parse(stringified);
                }).value();
        }

        var dataframe = $.csv.toObjects(data);
        // console.log(dataframe);
        //select and rename columns
        var list_bench = _.map(dataframe, function (row) {
            return {
                "Timestamp_utc": row.Timestamp_utc,
                "GazeX": parseInt(row.GazeX_s_px),
                "GazeY": parseInt(row.GazeY_s_px),
                "sacc": $.parseJSON(row.saccade.toLowerCase()),
                "FixationIndex": parseInt(row.FixationIndex),
                "FixationPointX_bench": parseFloat(row["FixationPointX..MCSpx."]),
                "FixationPointY_bench": parseFloat(row["FixationPointY..MCSpx."]),
                "AbsoluteSaccadicDirection": parseFloat(row.AbsoluteSaccadicDirection)
            };
        });

        var min_time = findMinTime(_.pluck(list_bench, "Timestamp_utc"));
        // console.log("mintime:" + min_time);
        // console.log(_.pluck(list_bench, "Timestamp_utc"));
        // var min_time = findMinTime(_.pluck(list_bench, "Timestamp_utc"));

        var l_time =  _.map(_.pluck(list_bench, "Timestamp_utc"), function (row) {
            return time_trans(row, min_time);
        });

        list_bench = _.map(list_bench, function (row, index) {
            return {
                "Timestamp_utc": row.Timestamp_utc,
                "GazeX": row.GazeX,
                "GazeY": row.GazeY,
                "sacc": row.sacc,
                "FixationIndex": row.FixationIndex,
                "FixationPointX_bench": row.FixationPointX_bench,
                "FixationPointY_bench": row.FixationPointY_bench,
                "AbsoluteSaccadicDirection": row.AbsoluteSaccadicDirection,
                "time": l_time[index]
            };
        });

        // console.log(list_bench.time);
        
        // console.log("bench: ");
        // console.log(list_bench);

        var result = RTP.fixation_calculation(list_bench);

        var fixation_list = result.fixation_list;
        // compare
        var fixationX_list_test = _.pluck(fixation_list, "FixationX");
        var fixationY_list_test = _.pluck(fixation_list, "FixationY");
        var angle_list_test = _.pluck(fixation_list, "Angle");

        var fixation_bench = _.map(dataframe, function (row) {
            return {
                "FixationIndex": parseInt(row.FixationIndex),
                "FixationPointX_bench": parseFloat(row["FixationPointX..MCSpx."]),
                "FixationPointY_bench": parseFloat(row["FixationPointY..MCSpx."]),
                "AbsoluteSaccadicDirection": parseFloat(row.AbsoluteSaccadicDirection)
            };
        });

        // drop duplicates
        // console.log(fixation_bench.length);
        // fixation_bench = _.uniq(fixation_bench);
        fixation_bench = uniqueObjects(fixation_bench);

        // console.log(fixation_bench.length);

        var fixationX_list_bench = _.pluck(fixation_bench, "FixationPointX_bench");
        var fixationY_list_bench = _.pluck(fixation_bench, "FixationPointY_bench");
        var angle_list_bench = _.pluck(fixation_bench, "AbsoluteSaccadicDirection");

        fixationX_list_test = _.map(fixationX_list_test, function (elem) { return parseFloat(elem).toFixed(2); });
        fixationX_list_bench = _.map(fixationX_list_bench, function (elem) { return parseFloat(elem).toFixed(2); });
        fixationY_list_test = _.map(fixationY_list_test, function (elem) { return parseFloat(elem).toFixed(2); });
        fixationY_list_bench = _.map(fixationY_list_bench, function (elem) { return parseFloat(elem).toFixed(2); });
        angle_list_test = _.map(angle_list_test, function (elem) { return parseFloat(elem).toFixed(2); });
        angle_list_bench = _.map(angle_list_bench, function (elem) { return parseFloat(elem).toFixed(2); });

        // for (i in fixationX_list_test){
        //     console.log(fixationX_list_test[i] + "\t" + fixationX_list_bench[i]);
        // }

        // console.log(fixationX_list_test.length);
        // console.log(fixationX_list_bench.length);

        if (_.isEqual(fixationX_list_test, fixationX_list_bench))
            console.log("fixation x same");
        else
            console.log("fixation x diff");

        if (_.isEqual(fixationY_list_test, fixationY_list_bench))
            console.log("fixation y same");
        else
            console.log("fixation y diff");

        if (_.isEqual(angle_list_test, angle_list_bench))
            console.log("angle same");
        else
            console.log("angle diff");

    }, 'text');
};

RTP.test_feature_extraction = function (bench_filepath) {
    $.get(bench_filepath, function (data) {
        function time_trans(curtime_string, mintime_string) {
            var curtime = new Date(curtime_string);
            var mintime = new Date(mintime_string);
            var gap = (curtime.getTime() - mintime.getTime()).toFixed(1);
            return gap;
        }

        function findMinTime(array) {
            // array of utc times
            var tmoments = _.map(array, function (timestr) {
                return moment(timestr);
            });
            return moment.min(tmoments);
        }

        function uniqueObjects(arrayOfObj) {
            return _.chain(arrayOfObj)
                .map(function (obj) {
                    return JSON.stringify(obj);
                }).uniq().map(function (stringified) {
                    return JSON.parse(stringified);
                }).value();
        }

        var dataframe = $.csv.toObjects(data);
        // console.log(dataframe);
        //select and rename columns
        var list_bench = _.map(dataframe, function (row) {
            return {
                "Timestamp_utc": row.Timestamp_utc,
                "GazeX": parseInt(row.GazeX_s_px),
                "GazeY": parseInt(row.GazeY_s_px),
                "sacc": $.parseJSON(row.saccade.toLowerCase()),
                "FixationIndex": parseInt(row.FixationIndex),
                "FixationPointX_bench": parseFloat(row["FixationPointX..MCSpx."]),
                "FixationPointY_bench": parseFloat(row["FixationPointY..MCSpx."]),
                "AbsoluteSaccadicDirection": parseFloat(row.AbsoluteSaccadicDirection)
            };
        });

        var min_time = findMinTime(_.pluck(list_bench, "Timestamp_utc"));

        var l_time =  _.map(_.pluck(list_bench, "Timestamp_utc"), function (row) {
            return time_trans(row, min_time);
        });

        list_bench = _.map(list_bench, function (row, index) {
            return {
                "Timestamp_utc": row.Timestamp_utc,
                "GazeX": row.GazeX,
                "GazeY": row.GazeY,
                "sacc": row.sacc,
                "FixationIndex": row.FixationIndex,
                "FixationPointX_bench": row.FixationPointX_bench,
                "FixationPointY_bench": row.FixationPointY_bench,
                "AbsoluteSaccadicDirection": row.AbsoluteSaccadicDirection,
                "time": l_time[index]
            };
        });

        console.log(list_bench);

        var result = RTP.fixation_calculation(list_bench);
        var fixation_list = result.fixation_list;
        var saccade_list = result.saccade_list;

        console.log("fixation_list: " + JSON.stringify(fixation_list));
        console.log("saccade_list: " + JSON.stringify(saccade_list));

        var featurelist_mix = RTP.feature_extraction(fixation_list,
                                                    saccade_list,
                                                    "Mix",
                                                    [721, 617, 721+478, 617, 67],
                                                    [1089, 297, 1089+139, 297+141],
                                                    [558, 246, 558+456, 246+273]);
        console.log("featurelist_mix: "  + featurelist_mix);
    }, 'text');

};

// =============================================================================
// data preprocessing
// =============================================================================

/* eslint-disable camelcase*/
(function(window) {
    window.mwdet_preprocessor = window.mwdet_preprocessor || {};

    /**
     * 
     * @param {*} timestamp_org 
     * @param {*} gap 
     * @param {*} cal 
     * @return {*} new_time_string
     */
    function time_string_calcultion_ms(timestamp_org, gap, cal) {
        var time = new Date(timestamp_org);
        var new_time = time;

        if (cal === 'add') {
            new_time = time.valueOf + gap;
        } else if (cal === 'minus') {
            new_time = time.valueOf - gap;
        }

        var new_time_string = (new Date(new_time)).toISOString();
        return new_time_string;
    }

    /**
     * 
     * @param {*} timestring_1 
     * @param {*} timestring_2 
     * @return {*} timegap
     */
    function timegap_calculation_ms(timestring_1, timestring_2) {
        var time_1 = new Date(timestring_1);
        var time_2 = new Date(timestring_2);
        return Math.abs(time_2 - time_1);
    }

    /**
     * 
     * @param {*} gaze 
     * @return {*} timestamp from gazedata
     */
    function getGazeTimestamp(gaze) {
        return (new Date(gaze.time)).valueOf();
    }

    /**
     * @param {*} gaze
     * @return {bool} true if gaze data is null or contains null x/y. Else false;
     */
    function gazeIsNull(gaze) {
        if (typeof gaze === 'undefined' || gaze === null || gaze === 'null') return true;
        if (gaze.GazeX === 'null' || gaze.GazeX === null) return true;
        if (gaze.GazeY === 'null' || gaze.GazeY === null) return true;
        return false;
    }

    mwdet_preprocessor.windowFill = function(window, step) {
        if (typeof step === 'undefined' || step.length === 0) return;
        var endTime = getGazeTimestamp(step[step.length - 1]) + 100;
        var currentTime = 0;
        if (window.length === 0) {
            currentTime = getGazeTimestamp(step[0]); // timestamp of first gaze data in step
        } else {
            currentTime = getGazeTimestamp(window[window.length - 1]) + 200; // last gaze data in window
        }

        while (currentTime < endTime) {
            var sample_start_time = currentTime - 100;
            var sample_end_time = currentTime + 100;

            // step 1: too high frequency
            while (getGazeTimestamp(step[0]) < sample_start_time) {
                step.shift();
            }

            // step 2: too low frequency
            if (getGazeTimestamp(step[0]) >= sample_end_time) {
                var null_gaze_data = {
                    'time': new Date(currentTime),
                    'GazeX': null,
                    'GazeY': null,
                };
                window.push(null_gaze_data);
                currentTime = currentTime + 200;
                continue;
            }

            var temp_gap = 100;
            var temp_timestamp = currentTime;
            var temp_x = null;
            var temp_y = null;

            // So we do not pop the data at the beginning
            var step_temp_index = 0
            while (step.length > 0 && getGazeTimestamp(step[step_temp_index]) >= sample_start_time && getGazeTimestamp(step[step_temp_index]) < sample_end_time) {
                console.log(">>>" + step_temp_index);
                console.log(">>>" + JSON.stringify(step[step_temp_index]));
                var current_gaze_data = step[step_temp_index];
                if (gazeIsNull(current_gaze_data)) {
                    step_temp_index = step_temp_index + 1
                    continue;
                } else {
                    var gap = timegap_calculation_ms(getGazeTimestamp(current_gaze_data), currentTime);
                    if (gap <= temp_gap) {
                        temp_timestamp = getGazeTimestamp(current_gaze_data);
                        temp_x = current_gaze_data.GazeX;
                        temp_y = current_gaze_data.GazeY;
                        temp_gap = gap;
                    }
                    step_temp_index = step_temp_index + 1
                }
            }

            // for those data in (currentTime-100, currentTime+100) but after the selected gazedata, we keep them in step
            while (step.length > 0 && getGazeTimestamp(step[0]) <= temp_timestamp) {
                step.shift();
            }            

            var temp_gaze_data = {
                'time': new Date(temp_timestamp),
                'GazeX': temp_x,
                'GazeY': temp_y,
            };

            window.push(temp_gaze_data);

            currentTime = temp_timestamp + 200;
        }
    
        while (getGazeTimestamp(window[0]) < (endTime - 30000)) {
            window.shift();
        }

        return window;
    }

    mwdet_preprocessor.windowSplit = function(gaze_array) {
        var list_gaze_array = [];
        var current_gaze_array = [];
        var count_non_gaze_data = 0;

        // eslint-disable-next-line
        for (var g in gaze_array) {
            var gaze = gaze_array[g];
            if (!gazeIsNull(gaze)) {
                if (count_non_gaze_data > 1) {
                    if (current_gaze_array.length > 3) {
                        list_gaze_array.push(current_gaze_array);
                    }
                    current_gaze_array = [];
                    count_non_gaze_data = 0;
                }
                current_gaze_array.push(gaze);
                count_non_gaze_data = 0;
            } else {
                count_non_gaze_data = count_non_gaze_data + 1;
                continue;
            }
        }
        if (current_gaze_array.length > 3) {
            list_gaze_array.push(current_gaze_array);
        }
        return list_gaze_array;
    };
}) (window);