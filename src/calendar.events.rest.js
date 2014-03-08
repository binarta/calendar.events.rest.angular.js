angular.module('calendar.events.sources', ['calendar.events.rest']);
angular.module('calendar.events.rest', [])
    .factory('calendarEventWriter', ['usecaseAdapterFactory', 'restServiceHandler', 'config', 'topicMessageDispatcher', CalendarEventWriterFactory])
    .factory('calendarEventSourceFactory', ['usecaseAdapterFactory', 'restServiceHandler', 'config', CalendarEventSourceFactory])
    .factory('calendarEventDeleter', ['usecaseAdapterFactory', 'restServiceHandler', 'config', 'topicMessageDispatcher', CalendarEventDeleterFactory])
    .factory('calendarEventUpdater', ['usecaseAdapterFactory', 'restServiceHandler', 'config', 'topicMessageDispatcher', CalendarEventUpdaterFactory])
    .factory('calendarEventViewer', ['usecaseAdapterFactory', 'config', 'restServiceHandler', CalendarEventViewerFactory]);


function CalendarEventWriterFactory(usecaseAdapterFactory, restServiceHandler, config, topicMessageDispatcher) {
    return function (event, $scope, presenter) {

        var ctx = usecaseAdapterFactory($scope);
        formatDates(event, ['start', 'end']);
        ctx.params = {
            method: 'PUT',
            withCredentials: true,
            data: event,
            url: (config.baseUri || '') + 'api/entity/calendarevent'
        };
        ctx.success = presenter.success;
        restServiceHandler(ctx);

        function formatDates(obj, fields) {
            fields.forEach(function (it) {
                obj[it] = moment(obj[it]).toISOString();
            });
        }
    }
}

function CalendarEventSourceFactory(usecaseAdapterFactory, restServiceHandler, config) {
    return function (it) {
        return function (query) {
            var ctx = usecaseAdapterFactory({});
            ctx.params = {
                method: 'POST',
                url: (config.baseUri || '') + 'api/query/calendarevent/findBetween',
                data: {
                    args: {
                        type: it.id,
                        start: query.start,
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
    return function (args) {
        var ctx = usecaseAdapterFactory({});
        ctx.params = {
            method: 'DELETE',
            withCredentials: true,
            url: (config.baseUri || '') + 'api/entity/calendarevent/' + args.id
        };
        ctx.success = function () {
            topicMessageDispatcher.fire('calendar.event.removed', 'success');
        };
        restServiceHandler(ctx);
    }
}

function CalendarEventUpdaterFactory(usecaseAdapterFactory, restServiceHandler, config, topicMessageDispatcher) {
    return function (event) {
        event.context = 'update';
        event.start = moment(event.start).toISOString();
        event.end = moment(event.end).toISOString();
        var context = usecaseAdapterFactory({});
        context.params = {
            method: 'POST',
            withCredentials: true,
            url: (config.baseUri || '') + 'api/entity/calendarevent',
            data: event
        };
        context.success = function () {
            topicMessageDispatcher.fire('calendar.event.updated', 'success');
        };
        restServiceHandler(context);
    }
}

function CalendarEventViewerFactory(usecaseAdapterFactory, config, restServiceHandler) {
    return function(id, $scope) {
        var context = usecaseAdapterFactory($scope);
        context.params = {
            method:'GET',
            url: (config.baseUri || '') + 'api/entity/calendarevent/'+id,
            headers: {
                'x-namespace': config.namespace
            }
        };
        context.success = function(payload) {
            $scope.event = payload;
        };
        restServiceHandler(context);
    }
}