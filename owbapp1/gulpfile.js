var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var rimraf = require('rimraf');
var buffer = require('vinyl-buffer');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var to5 = require('gulp-6to5');
var glob = require('glob');
var minimist = require('minimist');


var AUTOPREFIXER_BROWSERS = [
  'last 2 FirefoxAndroid versions',
  'last 2 Firefox versions'
];

//BrowserSync
gulp.task('browserSync', function(){
  browserSync.init(null, {
    server:{
      baseDir: './webapp'
    }
  });
});

//reload task
gulp.task('reload', function () {
  browserSync.reload();
});

//watch task
gulp.task('watch', function () {
  gulp.watch(['webapp/**/*.html'], ['reload']);
  gulp.watch(['source/css/**/*.scss', '!source/_temp/**/*.css'], function(){
    runSequence('css','reload');
  });
  gulp.watch(['source/js/**/*.js', '!source/_temp/**/*.js'], function()
    {
      runSequence('js','reload');
    });
});

//launcn server
gulp.task('server', ['js','css'], function(){
  gulp.start(['watch','browserSync']);
});

//concat libs
gulp.task('lib_js', function(){
  libs = [
    'bower_components/jquery/dist/jquery.min.js'
  ];

  return gulp.src(libs)
  .pipe(plugins.concat('libs.js'))
  .pipe(gulp.dest('source/_temp'));
});

gulp.task('lib_css', function(){
  return gulp.src(
    [
      //'source/css/angular-csp.css'
    ])
  .pipe(plugins.concat('libs.css'))
  .pipe(gulp.dest('source/_temp'));
});

//transpile es6 to es5
gulp.task('transpileEs', function(){
  return gulp.src(['source/js/**/*.js', '!source/_temp/**/*.js'])
  .pipe(to5())
  .pipe(gulp.dest('source/_temp'));
});

gulp.task('browserify', ['transpileEs'], function(){
  return browserify('./source/_temp/main.js')
  .bundle()
  .pipe(source('ble.js'))
  .pipe(buffer())
  //.pipe(plugins.uglify())
  .pipe(gulp.dest('./source/_temp'));
});


gulp.task('js', ['lib_js','browserify'], function(cb){
  return runSequence('concatjs',cb);
});

gulp.task('concatjs',function(cb){
    gulp.src(['./source/_temp/libs.js','./source/_temp/ble.js'])
    .pipe(plugins.concat('ble.js'))
    .pipe(gulp.dest('./webapp/js')).on('end', cb);
});

gulp.task('cleanupjs',function(cb){
  return rimraf('./source/_temp',cb);
});

gulp.task('css', ['sass','lib_css'], function(cb){
  return runSequence('concatcss', cb);
});

gulp.task('concatcss',function(cb){
    gulp.src(['./source/_temp/libs.css', './source/_temp/main.css'])
    .pipe(plugins.concat('app.css'))
    .pipe(gulp.dest('./webapp/css')).on('end', cb);
});

gulp.task('cleanupcss',function(cb){
  return rimraf('./source/_temp',cb);
});

// Compile and Automatically Prefix Stylesheets
gulp.task('sass', function() {
  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
    './source/scss/*.scss'
  ])
  .pipe(plugins.changed('styles', {extension: '.scss'}))
  .pipe(plugins.sass())
  .pipe(plugins.autoprefixer(AUTOPREFIXER_BROWSERS))
  .pipe(gulp.dest('.tmp/styles'))
  // Concatenate And Minify Styles
  .pipe(plugins.if('*.css', plugins.csso()))
  .pipe(gulp.dest('./source/_temp'));
});


gulp.task('deploy', function(){
  runSequence(['js','css'], 'copy');
});
