module.exports = function(config) {
    config.set({
        basePath:'../',
        frameworks:['jasmine'],
        files:[
            {pattern:'bower_components/angular/angular.js'},
            {pattern:'bower_components/angular-mocks/angular-mocks.js'},
            {pattern:'bower_components/thk-rest-client-mock/src/rest.client.mock.js'},
            {pattern:'bower_components/thk-config-mock/src/config.mock.js'},
            {pattern:'bower_components/binarta.momentx.angular/src/momentx.js'},
            {pattern:'bower_components/moment/moment.js'},
            {pattern:'bower_components/angular-moment/angular-moment.js'},
            {pattern:'src/**/*.js'},
            {pattern:'test/**/*.js'}
        ],
        browsers:['PhantomJS']
    });
};