module.exports = function () {
    var client = './src/client/';
    var clientApp = client + 'scripts/';
    var server = './src/server/'
    var temp = './tmp/';
    
    var config = {
        sassLinter: './.scss-lint.yml',
        // all js vet
        alljs: [
            './src/**/*.js',
            './*js'
        ],
        client: client,
        css: temp + 'styles.css',
        index: client + 'index.html',
        dashboard: client + 'dashboard.html',
        js: [
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js' 
        ],
        sass: [
            client + 'styles/**/*.scss',
            '!' + client + 'styles/layout/_grid.scss',
            '!' + client + 'styles/layout/_media.scss'
        ],
        server: server,
        temp: temp,
        
        /*
         * Browser Sync
         */
        browserReloadDelay: 1000,
        
        /*
         * Bower and NPM locations
         */
        bower: {
            json: require('./bower.json'),
            directory: './bower_components/',
            ignorePath: '../..'
        },
        
        /*
         * Node settings
         */
        defaultPort: 7203,
        nodeServer: './src/server/app.js',
        
    };
    
    config.getWiredepDefaultOptions = function() {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };
        return options;
    };
    
    return config;
};