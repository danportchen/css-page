var gulp = require ('gulp');
var $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var watch = require('gulp-watch');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
// var concat = require('gulp-concat');
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');
var sequence = require('gulp-sequence');


var envOptions = {
  string: 'env',
  default:{env: 'develop'}
};
var options = minimist(process.argv.slice(2), envOptions);
console.log(options);

gulp.task('clean', function () {
  return gulp.src(['./.tmp','./public'])
      .pipe($.clean());
});

gulp.task('copyHTML', function(){
  return gulp.src('./source/**/*.html')
  .pipe(gulp.dest('./public/'))
});

gulp.task('jade', function() {
  // var YOUR_LOCALS = {};
 
  gulp.src('./source/**/*.jade')
    .pipe($.plumber())
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest('./public/'))
    .pipe(browserSync.stream());
});

gulp.task('sass', function () {
  var plugins = [
    autoprefixer({browsers: ['last 3 version']})
  ];
  return gulp.src('./source/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(plugins))
    .pipe($.if (options.env === 'production',$.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
});

gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if (options.env === 'production',$.uglify({
          compress: {
            drop_console: true
          }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream())
);

gulp.task('bower', function() {
  return gulp.src(mainBowerFiles())
      .pipe(gulp.dest('./.tmp/vandors/'))
});

gulp.task('vandorjs',['bower'], function(){
  return gulp.src('./.tmp/vandors/**/*.js')
  .pipe($.concat('vandors.js'))
  .pipe($.if (options.env === 'production',$.uglify()))
  .pipe(gulp.dest('./public/js'));
});

gulp.task('image-min', () =>
    gulp.src('./source/images/*')
        .pipe($.if (options.env === 'production', $.imagemin()))
        .pipe(gulp.dest('./public/images'))
);

gulp.task('browser-sync', function() {
  browserSync.init({
      server: {
          baseDir: "./public"
      },
      reloadDebounce: 2000
  });
});

gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});

gulp.task('watch', function () {
  gulp.watch('./source/scss/**/*.scss', ['sass']);
  gulp.watch('./source/**/*.jade', ['jade']);
  gulp.watch('./source/js/**/*.js', ['babel']);
});

gulp.task('build', sequence('clean','jade', 'sass','babel','vandorjs','image-min'));

gulp.task('default', ['jade', 'sass','babel','vandorjs','image-min','browser-sync', 'watch']);