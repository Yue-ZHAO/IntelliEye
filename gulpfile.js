// Include gulp
var gulp = require('gulp');
 // Include plugins
var concat = require('gulp-concat');
 // Concatenate JS Files
gulp.task('scripts', function() {
    return gulp.src([
        
        './public/ieye/js/tracking-mod.js',
        './public/ieye/js/client.min.js',              
        './public/ieye/js/iew-vcontrol.js',              
        './public/ieye/js/ieyewidget.js',              
        './public/ieye/js/iew-log.js',              
        './public/ieye/js/iew-controller.js',

        ])
      .pipe(concat('ieye-build.js'))
      .pipe(gulp.dest('./public/ieye/js/'));
});
 // Default Task
gulp.task('default', ['scripts']);
