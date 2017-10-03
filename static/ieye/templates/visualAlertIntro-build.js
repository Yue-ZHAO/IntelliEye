if(typeof INTROTEMPLATES === 'undefined') {var INTROTEMPLATES = {};}
INTROTEMPLATES['visualAlertIntro.html'] = "<div class=\"introOverlay\">\n" +
    "    <div class=\"introBox\">\n" +
    "        <div class=\"introTitle\">\n" +
    "            <img src=\"https://moocwidgets.cc/static/ieye/img/intellieye_logo_edx_h60.png\">\n" +
    "            <h1 class=\"customh1\">Welcome to IntelliEye</h1>\n" +
    "        </div>\n" +
    "\n" +
    "        <!-- =============================================================== -->\n" +
    "        <!-- INTRODUCTION PARAGRAPH -->\n" +
    "        <!-- =============================================================== -->\n" +
    "        <div class=\"introContent\">\n" +
    "            <p>\n" +
    "Imagine someone looking over your shoulder while you learn in this MOOC, reminding you to pay attention and alerting you when you become distracted. This would probably make you learn more efficiently!\n" +
    "<br>\n" +
    "IntelliEye is a first step towards this vision: an intelligent video player add-on we have developed at the Delft University of Technology. It will become active when you watch a lecture video: whenever the add-on detects a loss of focus on your part it will visually alert you by repeatedly flashing a red border around the video until it detects your focus again.\n" +
    "IntelliEye makes use of your Webcam to track your focus and attention. IntelliEye is privacy-aware: none of the Webcam data leaves your computer, all computations are made on your device.\n" +
    "            </p>\n" +
    "\n" +
    "            <img src=\"https://moocwidgets.cc/static/ieye/img/ieye_instructions_visual.png\" width=\"550px\" style=\"margin-top:20px;margin-bottom:40px\"><br>\n" +
    "\n" +
    "            <!-- =========================================================== -->\n" +
    "            <!-- HOW DOES IT INTELLIEYE DO IT? -->\n" +
    "            <!-- =========================================================== -->\n" +
    "            <span class='lm' id='lm1'><h2 class='h2-section'>How does IntelliEye do it?<span id='lm1-text' style='margin-left:5px'>Learn more</span></h2></span>\n" +
    "            <p class='ieye_descr' id='lm1-d'>\n" +
    "                IntelliEye makes use of the Webcam to track your face. \n" +
    "                If your face is not facing the screen (because you are talking to a friend, looking out of the window, wrapping your hands around it, leaning back heavily), \n" +
    "                IntelliEye assumes a loss of focus. If you are active in browser tabs/windows next to the video playing one (because you are checking your emails or browsing Reddit), \n" +
    "                IntelliEye also assumes a loss of focus.\n" +
    "            </p>\n" +
    "\n" +
    "            <!-- =========================================================== -->\n" +
    "            <!-- WHAT DO I NEED TO DO TO USE INTELLIEYE -->\n" +
    "            <!-- =========================================================== -->\n" +
    "            <span class='lm' id='lm2'><h2 class='h2-section'>What do I need to do to use IntelliEye?<span id='lm2-text' style='margin-left:5px'>Learn more</span></h2></span>\n" +
    "            <ul class='ieye_descr' id='lm2-d'>\n" +
    "                <li>Allow the edX site to make use of your Webcam when asked to do so (once more: none of the Webcam data leaves your machine).</li>\n" +
    "                <li>Ensure that your webcam is pointing at your face from the front. If you have multiple webcams, make sure that the one facing you frontally is the default webcam of your system.</li>\n" +
    "                <li>Face the camera and watch each lecture video as you normally would.</li>\n" +
    "            </ul>                                        \n" +
    "\n" +
    "\n" +
    "            <!-- =========================================================== -->\n" +
    "            <!-- WHAT DO I NEED TO DO TO USE INTELLIEYE -->\n" +
    "            <!-- =========================================================== -->\n" +
    "            <span class='lm' id='lm3'><h2 class='h2-section'>Who do I contact in case of concerns/issues/ideas?<span id='lm3-text' style='margin-left:5px'>Learn more</span></h2></span>\n" +
    "            <div class='ieye_descr' id='lm3-d'>\n" +
    "                IntelliEye is actively being developed at the Web Information Systems group of the Delft University of Technology. \n" +
    "                If you have feedback, please email Yue Zhao (one of the add-on developers) at <a href=\"mailto:y.zhao-1@tudelft.nl\">y.zhao-1@tudelft.nl</a>\n" +
    "            </div>     \n" +
    "\n" +
    "            <!-- =========================================================== -->\n" +
    "            <!-- ANYTHING ELSE -->\n" +
    "            <!-- =========================================================== -->\n" +
    "            <span class='lm' id='lm4'><h2 class='h2-section'>Anything else?<span id='lm4-text' style='margin-left:5px'>Learn more</span></h2></span>\n" +
    "            <div class='ieye_descr' id='lm4-d'>\n" +
    "                We currently only support laptop and desktop computers. IntelliEye is not supported on mobile platforms. We support a subset of the most popular browsers: Firefox, Opera and Chrome. Other browsers are not supported (if such browsers are detected, the IntelliEye add-on is deactivated). \n" +
    "            </div>     \n" +
    "        </div>\n" +
    "\n" +
    "        <!-- =============================================================== -->\n" +
    "        <!-- BUTTONS -->\n" +
    "        <!-- =============================================================== -->\n" +
    "        <div class=\"introInputs\">\n" +
    "            <div class=\"msgButton\" id=\"start_ieye\">Enable IntelliEye</div>\n" +
    "            <div class=\"msgButtonFaded\" id=\"skip_ieye\">Disable IntelliEye</div>\n" +
    "            \n" +
    "            <div id='remember_ieye'> For future:\n" +
    "                <input name=\"r_remember\" type=\"radio\" value=\"no\" id='i_dont_remember' checked><label for='i_dont_remember'>Always ask me</label>\n" +
    "                <input name=\"r_remember\" type=\"radio\" value=\"yes\" id='i_remember'><label for='i_remember'>Remember my choice</label>\n" +
    "            </div>\n" +
    "\n" +
    "            <i style=\"display:block;margin-top:20px\">Any choice you make in allowing/disallowing IntelliEye can be changed: a click on\n" +
    "                 <img src=\"https://moocwidgets.cc/static/ieye/img/intellieye_logo_edx_h60.png\" \n" +
    "                width=\"20\" height:\"20\" style=\"vertical-align:middle\"> will bring up this interface again.</i>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<script>\n" +
    "    $.each($('.lm'), (i, o) => {\n" +
    "        o.onclick = function() {\n" +
    "            var eq_id = $(o).attr('id');\n" +
    "            $('#' + eq_id + '-d').slideToggle();\n" +
    "            var eq_text_id = eq_id + '-text';\n" +
    "            if ($('#' + eq_text_id).text() === 'Learn more') {\n" +
    "                $('#' + eq_text_id).text('Hide');\n" +
    "            } else {\n" +
    "                $('#' + eq_text_id).text('Learn more');\n" +
    "            }\n" +
    "        }\n" +
    "    });\n" +
    "\n" +
    "    $('#start_ieye')[0].onclick = function () {\n" +
    "        IEyeController.setChoice(true);\n" +
    "        moocwidget.UI.ieye_intro_hide()\n" +
    "    };\n" +
    "\n" +
    "    $('#skip_ieye')[0].onclick = function () {\n" +
    "        IEyeController.setChoice(false);\n" +
    "        moocwidget.UI.ieye_intro_hide()\n" +
    "    };    \n" +
    "</script>\n" +
    ""; 