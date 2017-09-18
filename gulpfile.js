// Include gulp
var gulp = require('gulp');
var argv = require('yargs').argv;
 // Include plugins
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var rename = require('gulp-rename');

var sqeye = (argv.sqeye === undefined) ? false : true;
var ieye = (argv.ieye === undefined) ? false :true;
var driver = (argv.driver === undefined) ? false :true;

 // Concatenate & Minify JS
if (sqeye) {
  gulp.task('scripts', function() {
          return gulp.src([
            './public/sqeye/js/RTP.js',
            './public/sqeye/js/webgazer_mod.js',
            './public/sqeye/js/MWDET_gazer.js',
            './public/sqeye/js/MWDET_calibration.js',
            './public/sqeye/js/MWDET_gazerdata.js',
            './public/sqeye/js/MWDET_vcontrol.js',
            './public/sqeye/js/MWDET_logger.js',
            './public/sqeye/js/MWDET_widget.js',        
          ])
        .pipe(concat('sqeye-build.js'))
          .pipe(rename({suffix: '.min'}))
          .pipe(uglify())
          .pipe(gulp.dest('./public/sqeye/js/'));
  });
  // Default Task
  gulp.task('default', ['scripts']);
} else if (ieye) {
  gulp.task('scripts', function() {
          return gulp.src([
            './public/ieye/js/tracking-mod.js',
            './public/ieye/js/face-min.js',
            './public/ieye/js/client.min.js',              
            './public/ieye/js/iew-vcontrol.js',              
            './public/ieye/js/ieyewidget.js',              
            './public/ieye/js/iew-log.js',              
            './public/ieye/js/iew-controller.js',
          ])
        .pipe(concat('ieye-build.js'))
          .pipe(rename({suffix: '.min'}))
          .pipe(uglify())
          .pipe(gulp.dest('./public/ieye/js/'));
  });
  // Default Task
  gulp.task('default', ['scripts']);
} else if (driver) {
  gulp.task('scripts', function() {
          return gulp.src([
            './public/client.min.js',
            './public/moocwidget-dev.js',
          ])
        .pipe(concat('moocwidget.js'))
          .pipe(uglify())
          .pipe(gulp.dest('./public/'));
  });
  // Default Task
  gulp.task('default', ['scripts']);
} else {
  console.log('invalid params choose either: --sqeye or --ieye');
  process.exit(1);
}

