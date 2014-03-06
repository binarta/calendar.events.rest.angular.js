angular.module('calendar.events.sources', ['calendar.events.rest']);
angular.module('calendar.events.rest', [])
    .factory('calendarEventWriter', ['usecaseAdapterFactory', 'restServiceHandler', 'config', 'topicMessageDispatcher', CalendarEventWriterFactory])
    .factory('calendarEventSourceFactory', ['usecaseAdapterFactory', 'restServiceHandler', 'config', CalendarEventSourceFactory])
    .factory('calendarEventDeleter', ['usecaseAdapterFactory', 'restServiceHandler', 'config', 'topicMessageDispatcher', CalendarEventDeleterFactory])
    .factory('calendarEventUpdater', ['usecaseAdapterFactory', 'restServiceHandler', 'config', 'topicMessageDispatcher', CalendarEventUpdaterFactory]);


function CalendarEventWriterFactory(usecaseAdapterFactory, restServiceHandler, config, topicMessageDispatcher) {
    return function(event, $scope) {
        var ctx = usecaseAdapterFactory($scope);
        event.start = moment(event.start);
        event.end = moment(event.end);
        ctx.params = {
            method:'PUT',
            withCredentials:true,
            data: event,
            url: (config.baseUri || '') + 'api/entity/calendarevent'
        };
        ctx.success = function() {
            topicMessageDispatcher.fire('calendar.event.created', 'success');
        };
        restServiceHandler(ctx);
    }
}

function CalendarEventSourceFactory(usecaseAdapterFactory, restServiceHandler, config) {
    return function(it) {
        return function(query) {
            var ctx = usecaseAdapterFactory({});
            ctx.params = {
                method:'POST',
                url: (config.baseUri || '') + 'api/query/calendarevent/findBetween',
                data: {
                    args: {
                        type: it.id,
                        start:query.start,
                        end: query.end,
                        namespace: config.namespace
                    }
                }
            };
            ctx.success = query.presenter;
            restServiceHandler(ctx);
        }
    }
}

function CalendarEventDeleterFactory(usecaseAdapterFactory, restServiceHandler, config, topicMessageDispatcher) {
    return function(args) {
        var ctx = usecaseAdapterFactory({});
        ctx.params = {
            method:'DELETE',
            withCredentials:true,
            url: (config.baseUri || '') + 'api/entity/calendarevent/'+args.id
        };
        ctx.success = function() {
            topicMessageDispatcher.fire('calendar.event.removed', 'success');
        };
        restServiceHandler(ctx);
    }
}

function CalendarEventUpdaterFactory(usecaseAdapterFactory, restServiceHandler, config, topicMessageDispatcher) {
    return function(event) {
        event.context = 'update';
        event.start = moment(event.start);
        event.end = moment(event.end);
        var context = usecaseAdapterFactory({});
        context.params = {
            method: 'POST',
            withCredentials: true,
            url: (config.baseUri || '') + 'api/entity/calendarevent',
            data: event
        };
        context.success = function() {
            topicMessageDispatcher.fire('calendar.event.updated', 'success');
        };
        restServiceHandler(context);
    }
}