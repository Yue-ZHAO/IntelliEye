if(typeof INTROTEMPLATES === 'undefined') {var INTROTEMPLATES = {};}
INTROTEMPLATES['auditoryAlertIntro.html'] = "<div class=\"introOverlay\">\n" +
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
    "                For this course, we offer you IntelliEye, an experimental widget developed at TU Delft. \n" +
    "                IntelliEye will help you during watching MOOC videos. Whenever you lose focus watching the video playing, \n" +
    "                IntelliEye will detect it and alert you with a beeping sound \n" +
    "                (<img id=\"intro_alert_click\" style=\"cursor:pointer\" src=\"https://moocwidgets.cc/static/ieye/img/ieye_alert_icon.png\" width=\"20\" height:\"20\" style=\"vertical-align:middle\"> try me). \n" +
    "                Once you are focusing on the video again, the alert will stop. IntelliEye is an automated privacy-aware assistant \n" +
    "                (i.e. none of the webcam data leaves your computer) for you on the edX platform.\n" +
    "            </p>\n" +
    "\n" +
    "            <p>\n" +
    "                The following situations will be detected as inattention during the video watching:\n" +
    "                <ul>\n" +
    "                    <li>You are not facing the screen your webcam is aligned with.</li>\n" +
    "                    <li>You are doing some stuff on the other tabs/windows on your computer.</li>\n" +
    "                </ul>\n" +
    "            </p>       \n" +
    "\n" +
    "            <!-- =========================================================== -->\n" +
    "            <!-- TO USE INTELLIEYE -->\n" +
    "            <!-- =========================================================== -->\n" +
    "            <div id=\"intro-howto-cont\">\n" +
    "                <div>\n" +
    "                    <p>\n" +
    "                    To use IntelliEye:\n" +
    "                        <ul>\n" +
    "                            <li>allow the edx site to use your webcam when you are asked to do so,</li>\n" +
    "                            <li>face the camera and watch the video as you normally would.</li>\n" +
    "                        </ul>\n" +
    "                        IntelliEye is developed by TU Delft. Using this widget will be helpful for us to make better inattention-detection widgets in the future. \n" +
    "                        If you have any questions or feedback, please send an email to\n" +
    "                        <a href=\"mailto:y.zhao-1@tudelft.nl\">y.zhao-1@tudelft.nl</a> or <a href=\"mailto:y.zhao-1@tudelft.nl\">t.robal@tudelft.nl</a>. \n" +
    "                        <br>\n" +
    "                        <br>\n" +
    "                    </p>\n" +
    "                </div>\n" +
    "                <img src=\"https://moocwidgets.cc/static/ieye/img/ieye_instructions.png\" width=\"350px\">\n" +
    "            </div>\n" +
    "\n" +
    "            <!-- =========================================================== -->\n" +
    "            <!-- HOW DOES IT WORK -->\n" +
    "            <!-- =========================================================== -->\n" +
    "            <span class='lm' id='lm1'><h2 class='h2-section'>How does it work?<span id='lm1-text' style='margin-left:5px'>Learn more</span></h2></span>\n" +
    "            <p class='ieye_descr' id='lm1-d'>\n" +
    "            IntelliEye uses your computer webcam, with your permission, and looks for a face frame in the camera feed. \n" +
    "            Based on detected face frame, IntelliEye can estimate whether you are watching at the video, and then decide to pause/play the video. \n" +
    "            IntelliEye is <b>privacy aware</b> - no videofeed leaves your computer.            \n" +
    "            <br>\n" +
    "            <img src=\"https://moocwidgets.cc/static/ieye/img/ieye_instructions3.png\" width=\"400px\" style=\"margin-top:10px\">\n" +
    "            </p>\n" +
    "\n" +
    "            <!-- =========================================================== -->\n" +
    "            <!-- WHAT DO I NEED TO USE INTELLIEYE -->\n" +
    "            <!-- =========================================================== -->\n" +
    "            <span class='lm' id='lm2'><h2 class='h2-section'>What are required for using IntelliEye?<span id='lm2-text' style='margin-left:5px'>Learn more</span></h2></span>\n" +
    "            <div class='ieye_descr' id='lm2-d'>\n" +
    "                <ul>\n" +
    "                    <li>IntelliEye can only run on laptop and desktop computers. We do not support mobile platforms.</li>\n" +
    "                    <li>You can use IntelliEye with some modern web browsers, e.g., the latest version of Firefox, Opera and Chrome. Internet Explorer, Microsoft Edge and Safari are not supported currently.</li>\n" +
    "                    <li>We need your permission to use the built-in camera or the external camera on your machine. The camera should be aligned with the screen you are watching the video on.</li>\n" +
    "                </ul>                                        \n" +
    "            </div>\n" +
    "\n" +
    "            <!-- =========================================================== -->\n" +
    "            <!-- WHAT DO I NEED TO DO TO USE INTELLIEYE -->\n" +
    "            <!-- =========================================================== -->\n" +
    "            <span class='lm' id='lm3'><h2 class='h2-section'>What do I need to do to use IntelliEye?<span id='lm3-text' style='margin-left:5px'>Learn more</span></h2></span>\n" +
    "            <div class='ieye_descr' id='lm3-d'>As Intellieye depends on the face detection in the web camera video feed, you should pay attention to the following:\n" +
    "                <ul>\n" +
    "                    <li>Enable your webcam once asked.</li>\n" +
    "                    <li>Sit normally facing the camera.</li>\n" +
    "                    <li>Try not to put your hand around your face or between your face and the webcam.</li>\n" +
    "                    <li>Try not to lean back or forward heavily.</li>\n" +
    "                    <li>Watch the video as you usually do.</li>\n" +
    "                </ul>\n" +
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
    "            <i style=\"display:block;margin-top:20px\">To return to this window, or to change the choice you have made here, \n" +
    "            please click on the <img src=\"https://moocwidgets.cc/static/ieye/img/intellieye_logo_edx_h60.png\" \n" +
    "            width=\"20\" height:\"20\" style=\"vertical-align:middle\"> icon above the video.</i>\n" +
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
    "\n" +
    "    $('#intro_alert_click').on('click', () => {\n" +
    "        var audio = new Audio('https://moocwidgets.cc/static/ieye/alert.mp3');\n" +
    "        audio.play();	\n" +
    "    });\n" +
    "</script>\n" +
    ""; 