// Include gulp
var gulp = require('gulp');
var argv = require('yargs').argv;

// Include plugins
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var rename = require('gulp-rename');
var html2string = require('gulp-html2string');

gulp.task('driver', function() {
    return gulp.src([
    './static/client.min.js',
    './static/moocwidget-dev.js',
    ])
    .pipe(concat('moocwidget.js'))
        .pipe(babel({
            presets: ['es2015'],
        }))
        .pipe(uglify())
        .pipe(gulp.dest('./static/'));
});

gulp.task('html2js', function() {
    return gulp.src('./static/ieye/templates/*.html')
      .pipe(html2string({
        base: './static/ieye/templates/', // The base path of HTML templates 
        createObj: true, // Indicate wether to define the global object that stores 
                         // the global template strings 
        objName: 'INTROTEMPLATES', // Name of the global template store variable 
                              // say the converted string for myTemplate.html will be saved to TEMPLATE['myTemplate.html'] 
      }))
      .pipe(rename({suffix: '-build', extname: '.js'}))
      .pipe(gulp.dest('./static/ieye/templates/')); // Output folder 
  });
 
gulp.task('ieye-pause', ['html2js'], function() {
        return gulp.src([
        './static/ieye/templates/pauseIntro-build.js',
        './static/ieye/js/tracking-mod.js',
        './static/ieye/js/face-min.js',
        './static/ieye/js/client.min.js',              
        './static/ieye/js/iew-vcontrol.js',              
        './static/ieye/js/ieyewidget-pause.js',              
        './static/ieye/js/iew-log.js',              
        './static/ieye/js/iew-controller.js',
        ])
    .pipe(concat('ieye-build.js'))
        .pipe(rename({suffix: '-pause.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./static/ieye/js/'));
});

gulp.task('ieye-auditory', ['html2js'], function() {
        return gulp.src([
        './static/ieye/templates/auditoryAlertIntro-build.js',
        './static/ieye/js/tracking-mod.js',
        './static/ieye/js/face-min.js',
        './static/ieye/js/client.min.js',              
        './static/ieye/js/iew-vcontrol.js',              
        './static/ieye/js/ieyewidget-auditoryAlert.js',              
        './static/ieye/js/iew-log.js',              
        './static/ieye/js/iew-controller.js',
        ])
    .pipe(concat('ieye-build.js'))
        .pipe(rename({suffix: '-auditoryAlert.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./static/ieye/js/'));
});

gulp.task('ieye-visual', ['html2js'], function() {
        return gulp.src([
        './static/ieye/templates/visualAlertIntro-build.js',
        './static/ieye/js/tracking-mod.js',
        './static/ieye/js/face-min.js',
        './static/ieye/js/client.min.js',              
        './static/ieye/js/iew-vcontrol.js',              
        './static/ieye/js/ieyewidget-visualAlert.js',              
        './static/ieye/js/iew-log.js',              
        './static/ieye/js/iew-controller.js',
        ])
    .pipe(concat('ieye-build.js'))
        .pipe(rename({suffix: '-visualAlert.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./static/ieye/js/'));
});

gulp.task('default', ['driver', 'ieye-pause', 'ieye-auditory', 'ieye-visual']);
