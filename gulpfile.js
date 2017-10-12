var gulp = require('gulp');
var args = require('yargs').argv;
var browserSync = require('browser-sync');
var config = require('./gulp.config')();
var del = require('del');
var $ = require('gulp-load-plugins')({lazy: true});
var port = process.env.PORT || config.defaultPort;
var replace = require('gulp-replace');

gulp.task('vet', function(){
    log('Analizing source with JSHint and JSCS');

   return gulp
        .src(config.alljs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', { verbose: true }))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('styles', ['clean-styles'], function() {
    log('Compiling sass --> CSS');
    
    return gulp
    .src(config.sass)
    .pipe($.plumber())
    .pipe($.scssLint({
      'config': config.sassLinter,
    }))
    .pipe($.scssLint.failReporter())
    .pipe($.sass())
    .pipe($.autoprefixer({ browsers: ['last 2 version', '> 5%']}))
    .pipe(gulp.dest(config.temp))
    .pipe(browserSync.reload({ stream: true}));;
});

gulp.task('clean-styles', function(done) {
    var files = config.temp + '**/*.css';
    clean(files, done);
});

gulp.task('sass-watcher', function() {
   gulp.watch([config.sass], ['styles']);
});

gulp.task('wiredep', function() {
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;
    
    gulp
    .src(config.dashboard)
    .pipe(wiredep(options))
    .pipe($.inject(gulp.src(config.js)))
    .pipe(gulp.dest(config.client));

    return gulp
    .src(config.index)
    .pipe(wiredep(options))
    .pipe($.inject(gulp.src(config.js)))
    .pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'styles'], function() {
    gulp
    .src(config.dashboard)
    .pipe($.inject(gulp.src(config.css)))
    .pipe(gulp.dest(config.client));

    return gulp
    .src(config.index)
    .pipe($.inject(gulp.src(config.css)))
    .pipe(gulp.dest(config.client));
});

gulp.task('serve-dev', ['inject'], function() {
    var isDev = true;
    
    var nodeOptions = {
        script: config.nodeServer,
        delayTime: 1,
        env: {
            'PORT': port,
            'NODE_ENV': isDev ? 'dev' : 'build'
        },
        watch: [config.server]
    };
    
    return $.nodemon(nodeOptions)
    .on('restart', function(ev) {
        log('*** nodemon restarted');
        log('files changed on restart:\n' + ev);
        setTimeout(function(){
            browserSync.notify('reloading now ...');
            browserSync.reload({stream: false});
        }, config.browserReloadDelay)
    })
    .on('start', function(){
        log('*** nodemon started');
        startBrowserSync();
    })
    .on('crash', function(){
        log('*** nodemon crashed: script crashed');
    })
    .on('exit', function() {
        log('*** nodemon exited cleanly');
    });
});

gulp.task('build', function() {
    log('Building');
    
    gulp
    .src("./tmp/*")
    .pipe(gulp.dest("./build/tmp"));
    
    gulp
    .src("./src/client/dashboard.html")
    .pipe(gulp.dest("./build"));

    gulp
    .src("./src/client/index.html")
    .pipe(gulp.dest("./build"));
    
    gulp
    .src("./src/client/images/**")
    .pipe(gulp.dest("./build/images"));

    gulp
    .src("./bower_components/**")
    .pipe(gulp.dest("./build/bower_components"));
    
    gulp
    .src("./src/client/app/**")
    .pipe(replace('/api/customer/', 'http://dev.bogpolls.hugeops.com/HugePollApp/api/customer/'))
    .pipe(replace('/api/customers', 'http://dev.bogpolls.hugeops.com//HugePollApp/api/customers'))
    .pipe(gulp.dest("./build/src/client/app"))
    .pipe(gulp.dest("./build/app"));
    
});

gulp.task('build-local', function() {
    log('Building');
    
    gulp
    .src("./tmp/*")
    .pipe(gulp.dest("C:\\inetpub\\wwwroot\\HugePollSite\\client\\tmp"));
    
    gulp
    .src("./src/client/dashboard.html")
    .pipe(gulp.dest("C:\\inetpub\\wwwroot\\HugePollSite\\client"));

    gulp
    .src("./src/client/index.html")
    .pipe(gulp.dest("C:\\inetpub\\wwwroot\\HugePollSite\\client"));
    
    gulp
    .src("./src/client/images/**")
    .pipe(gulp.dest("C:\\inetpub\\wwwroot\\HugePollSite\\client\\images"));

    gulp
    .src("./bower_components/**")
    .pipe(gulp.dest("C:\\inetpub\\wwwroot\\HugePollSite\\client\\bower_components"));
    
    gulp
    .src("./src/client/app/**")
    .pipe(replace('/api/customer/', '/HugePollApp/api/customer/'))
    .pipe(replace('/api/customers', '/HugePollApp/api/customers'))
    .pipe(gulp.dest("C:\\inetpub\\wwwroot\\HugePollSite\\client\\src\\client\\app"))
    .pipe(gulp.dest("C:\\inetpub\\wwwroot\\HugePollSite\\client\\app"));
});

///////////

function changeEvent(event) {
    log('File ' + event.path + ' ' + event.type);
}

function startBrowserSync()
{
    if(args.nosync || browserSync.active){
        return;
    }
    
    log('Starting browser-sync on port ' + port);
    
    gulp.watch([config.sass], ['styles'])
        .on('change', function(event) { 
        changeEvent(event);
        log('sass changed');
    });
    
    gulp.watch(config.css, function(){
       gulp.src(config.css)
       .pipe(browserSync.stream());
    });
    
    var options = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: [
            config.client + '**/*.css',
            config.client + '**/*.js',
            config.client + '**/*.html'
            
        ],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };
    
    browserSync(options);
}


function clean(path,done) {
    log('Cleaning: ' + $.util.colors.blue(path));
    del(path);
    done();
}

function log(msg) {
    if(typeof(msg) === 'object'){
        for (var item in msg) {
            if (msg.hasOwnProperty(item)){
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}