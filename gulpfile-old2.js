var html2string = require('gulp-html2string');
var gulp = require('gulp');
var rename = require('gulp-rename');
var path = require('path');
 
gulp.task('html2js', function () {
    return gulp.src('./public/ieye/templates/*.html')
      .pipe(html2string({
        base: './public/ieye/templates/', //The base path of HTML templates 
        createObj: true, // Indicate wether to define the global object that stores 
                         // the global template strings 
        objName: 'TEMPLATES'  // Name of the global template store variable 
                              //say the converted string for myTemplate.html will be saved to TEMPLATE['myTemplate.html'] 
      }))
      .pipe(rename({extname: '.js'}))
      .pipe(gulp.dest('./public/ieye/templates/')); //Output folder 
  });
 
gulp.task('default', ['html2js']);