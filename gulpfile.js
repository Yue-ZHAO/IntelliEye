// Include gulp
var gulp = require('gulp');
var argv = require('yargs').argv;
 // Include plugins
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var rename = require('gulp-rename');
var html2string = require('gulp-html2string');

gulp.task('driver', function() {
        return gulp.src([
        './public/client.min.js',
        './public/moocwidget-dev.js',
        ])
    .pipe(concat('moocwidget.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./public/'));
});

gulp.task('html2js', function() {
    return gulp.src('./public/ieye/templates/*.html')
      .pipe(html2string({
        base: './public/ieye/templates/', // The base path of HTML templates 
        createObj: true, // Indicate wether to define the global object that stores 
                         // the global template strings 
        objName: 'INTROTEMPLATES', // Name of the global template store variable 
                              // say the converted string for myTemplate.html will be saved to TEMPLATE['myTemplate.html'] 
      }))
      .pipe(rename({suffix: '-build', extname: '.js'}))
      .pipe(gulp.dest('./public/ieye/templates/')); // Output folder 
  });
 
gulp.task('ieye-pause', ['html2js'], function() {
        return gulp.src([
        './public/ieye/templates/pauseIntro-build.js',
        './public/ieye/js/tracking-mod.js',
        './public/ieye/js/face-min.js',
        './public/ieye/js/client.min.js',              
        './public/ieye/js/iew-vcontrol.js',              
        './public/ieye/js/ieyewidget-pause.js',              
        './public/ieye/js/iew-log.js',              
        './public/ieye/js/iew-controller.js',
        ])
    .pipe(concat('ieye-build.js'))
        .pipe(rename({suffix: '-pause.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./public/ieye/js/'));
});

gulp.task('ieye-auditory', ['html2js'], function() {
        return gulp.src([
        './public/ieye/templates/auditoryAlertIntro-build.js',
        './public/ieye/js/tracking-mod.js',
        './public/ieye/js/face-min.js',
        './public/ieye/js/client.min.js',              
        './public/ieye/js/iew-vcontrol.js',              
        './public/ieye/js/ieyewidget-auditoryAlert.js',              
        './public/ieye/js/iew-log.js',              
        './public/ieye/js/iew-controller.js',
        ])
    .pipe(concat('ieye-build.js'))
        .pipe(rename({suffix: '-auditoryAlert.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./public/ieye/js/'));
});

gulp.task('ieye-visual', ['html2js'], function() {
        return gulp.src([
        './public/ieye/templates/visualAlertIntro-build.js',
        './public/ieye/js/tracking-mod.js',
        './public/ieye/js/face-min.js',
        './public/ieye/js/client.min.js',              
        './public/ieye/js/iew-vcontrol.js',              
        './public/ieye/js/ieyewidget-visualAlert.js',              
        './public/ieye/js/iew-log.js',              
        './public/ieye/js/iew-controller.js',
        ])
    .pipe(concat('ieye-build.js'))
        .pipe(rename({suffix: '-visualAlert.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./public/ieye/js/'));
});

gulp.task('default', ['driver', 'ieye-pause', 'ieye-auditory', 'ieye-visual']);
