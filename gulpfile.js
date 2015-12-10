
// Util
var gulp = require('gulp'),
    rename = require('gulp-rename'),
    plumber = require('gulp-plumber'),
    bower = require('gulp-bower'),
    cp = require('child_process'),
    notify = require('gulp-notify'),
    sourcemaps = require('gulp-sourcemaps'),

// CSS
    sass = require('gulp-sass'),
    prefix = require('gulp-autoprefixer'),
    minifyCSS = require('gulp-minify-css'),

// JS BUILD
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),

// Browser sync
    browserSync = require('browser-sync'),

// Images files
    pngquant = require('imagemin-pngquant'),
    imagemin = require('gulp-imagemin');


// Config Variables 
var bowerDir = './bower_components/';
var assetsDir = {
  styles: './assets/stylesheets/',
  scripts: './assets/scripts/',
  images: './assets/images/',
  fonts: './assets/fonts/'
};

// Path Bower Components 
var path = {
    jquery: bowerDir + '/jquery/dist/jquery.min.js',
    bootstrap: bowerDir + 'bootstrap-sass/assets/',
    bourbon: bowerDir + 'bourbon/app/assets/stylesheets/',
    neat: bowerDir + 'neat/app/assets/stylesheets/',
    fontawesome: bowerDir + 'font-awesome/',
    normalize: bowerDir + 'normalize-css/normalize.css'
};

//Messages

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};


//  Bower update & Vendor Assets Build ++ uncomment as needed by project

gulp.task('jquery', function () {
    return gulp.src(path.jquery)
        .pipe(gulp.dest(assetsDir.scripts + 'vendors'));
});

gulp.task('bootstrap', function () {
    
    gulp.src(path.bootstrap + 'javascripts/bootstrap.min.js')
        .pipe(gulp.dest(assetsDir.scripts + 'vendors')); //Js
    
    gulp.src(path.bootstrap + 'stylesheets/**/*')
       .pipe(gulp.dest(assetsDir.styles + 'vendors/bootstrap')); //Css 
});

gulp.task('bourbon', function () {
    return gulp.src(path.bourbon + '**/*')
        .pipe(gulp.dest(assetsDir.styles + 'vendors/bourbon'));
});

gulp.task('neat', function () {
    return gulp.src(path.neat + '**/*')
        .pipe(gulp.dest(assetsDir.styles + 'vendors/neat'));
});

gulp.task('fontawesome', function () {
    gulp.src(path.fontawesome + 'fonts/*')
        .pipe(gulp.dest(assetsDir.fonts + 'fontawesome'));

    gulp.src(path.fontawesome + 'scss/*')   ///if need SASS
        .pipe(gulp.dest(assetsDir.styles + 'vendors/fontawesome/'));
});

gulp.task('normalize', function () {
    return gulp.src(path.normalize)
        .pipe(gulp.dest(assetsDir.styles + 'vendors/normalize'));
});


gulp.task('bower', function() {
    bower({ cmd: 'update'});
});

gulp.task('vendor', ['bower', 'jquery', 'bootstrap', 'bourbon', 'neat', 'fontawesome', 'normalize']);

/*******************************************************************************
## SASS TASKS
*******************************************************************************/

gulp.task('sass', function(){
    gulp.src(assetsDir.styles + 'main.scss')                // source
        .pipe(plumber())                                    // Use plumber
        .pipe(sass({
              includePaths: ['css'],
              onError: browserSync.notify
          }))
        // complete css with correct vendor prefixes
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7', 'ios 6', 'android 4'], { cascade: true }))
         // .pipe(rename({suffix: '.min'}))
        .pipe(minifyCSS())
        .pipe(gulp.dest('_site/assets/stylesheets'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest(assetsDir.styles));
});



/*******************************************************************************
## JS TASKS
*******************************************************************************/

// lint and concat custom js
gulp.task('lintJs', function() {
     gulp.src(assetsDir.scripts + 'custom/*.js')
      .pipe(plumber())
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'));
});

// Combine and Minify Custom and vendor JS for dist 

gulp.task('scriptsJs', ['lintJs']);
gulp.task('scriptsJs' ,function () {
      gulp.src(
        [
          assetsDir.scripts + 'vendors/jquery.min.js', 
          assetsDir.scripts + 'vendors/bootstrap.min.js',
          assetsDir.scripts + 'custom/**/*'
        ])
      .pipe(sourcemaps.init())
      .pipe(concat('scripts.js'))
      .pipe(gulp.dest(assetsDir.scripts))
      .pipe(rename({suffix: '.min'}))
      .pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('_site/assets/scripts'));
});


// Combine and Minify Custom and vendor JS for dist 

gulp.task('jscripts', ['scriptsJs']);

/*******************************************************************************
## IMAGES
*******************************************************************************/

gulp.task('images', function() {

  return gulp.src(assetsDir.images + 'raw/**/*')
        .pipe(imagemin({
          progressive: true,
          interlaced: true,
          svgoPlugins: [{removeViewBox: false}],
          use: [pngquant()]
        }))
        .pipe(gulp.dest(assetsDir.images));
});


/*******************************************************************************
## Jekyll
*******************************************************************************/

/**
Build the Jekyll Site
*/
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
Rebuild Jekyll & do page reload
*/
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'jscripts', 'images', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        },
        notify: false
    });
});

/*******************************************************************************
## Watch tasks
*******************************************************************************/


// Watch task
gulp.task('watch', function () {
    gulp.watch([assetsDir.styles + '*/**/*', '!assets/stylesheets/main.css'] , ['sass']);
    gulp.watch(assetsDir.scripts + '*/**/*', ['jscripts', 'jekyll-rebuild']);
    gulp.watch(assetsDir.images + '/raw/**.*',  ['images', 'jekyll-rebuild']);
    gulp.watch(assetsDir.fonts + '**/*',  ['jekyll-rebuild']);
    gulp.watch(['index.html', '_layouts/*', '_includes/*', '_posts/*'], ['jekyll-rebuild']);
});

/*******************************************************************************
## Default task, running just `gulp` will compile the sass,
compile the jekyll site, launch BrowserSync & watch files.
*******************************************************************************/

gulp.task('vendorSetup', ['bower', 'jquery', 'bootstrap', 'bourbon', 'neat', 'fontawesome', 'normalize']);
gulp.task('jekyllInit', ['sass', 'jscripts', 'images', 'jekyll-build']);
gulp.task('default', ['browser-sync', 'watch']);



