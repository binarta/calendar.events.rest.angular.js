angular.module('calendar.events.sources', ['calendar.events.rest']);
angular.module('calendar.events.rest', ['angular.usecase.adapter', 'rest.client', 'config', 'momentx'])
    .factory('calendarEventWriter', ['usecaseAdapterFactory', 'restServiceHandler', 'config', 'moment', CalendarEventWriterFactory])
    .factory('calendarEventSourceFactory', ['usecaseAdapterFactory', 'restServiceHandler', 'config', 'moment', CalendarEventSourceFactory])
    .factory('calendarEventDeleter', ['usecaseAdapterFactory', 'restServiceHandler', 'config', CalendarEventDeleterFactory])
    .factory('calendarEventUpdater', ['usecaseAdapterFactory', 'restServiceHandler', 'config', 'moment', CalendarEventUpdaterFactory])
    .factory('calendarEventViewer', ['usecaseAdapterFactory', 'config', 'restServiceHandler', CalendarEventViewerFactory])
    .service('calendarEventGateway', ['restServiceHandler', 'config', CalendarEventGateway]);

function CalendarEventGateway(rest, config) {
    this.findAllBetweenStartDateAndEndDate = function(request, response) {
        rest({
            params:{
                method:'POST',
                url:config.baseUri + 'api/usecase',
                data:{
                    headers:{
                        namespace:config.namespace,
                        usecase:'find.all.calendar.events.between.start.date.and.end.date'
                    },
                    payload:{
                        type:request.type,
                        startDate:request.startDate.format('YYYY-MM-DD'),
                        endDate:request.endDate.format('YYYY-MM-DD')
                    }
                }
            },
            success:response.success
        });
    }
}

function CalendarEventWriterFactory(usecaseAdapterFactory, restServiceHandler, config, moment) {
    return function (event, $scope, presenter) {

        var ctx = usecaseAdapterFactory($scope);
        formatDates(event, ['start', 'end']);
        ctx.params = {
            method: 'PUT',
            withCredentials: true,
            data: event,
            url: (config.baseUri || '') + 'api/entity/calendarevent'
        };
        if(presenter && presenter.success) ctx.success = presenter.success;
        restServiceHandler(ctx);

        function formatDates(obj, fields) {
            fields.forEach(function (it) {
                obj[it] = moment(obj[it]).toISOString();
            });
        }
    }
}

function CalendarEventSourceFactory(usecaseAdapterFactory, restServiceHandler, config, moment) {
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
            ctx.success = function(evts) {
                query.presenter(evts.map(function(evt) {
                    evt.start = moment(evt.start);
                    evt.end = moment(evt.end);
                    return evt;
                }));
            };
            restServiceHandler(ctx);
        }
    }
}

function CalendarEventDeleterFactory(usecaseAdapterFactory, restServiceHandler, config) {
    return function (args, presenter) {
        var ctx = usecaseAdapterFactory({});
        ctx.params = {
            method: 'DELETE',
            withCredentials: true,
            url: (config.baseUri || '') + 'api/entity/calendarevent/' + args.id
        };
        ctx.success = presenter.success;
        restServiceHandler(ctx);
    }
}

function CalendarEventUpdaterFactory(usecaseAdapterFactory, restServiceHandler, config, moment) {
    return function (event, $scope, presenter) {
        event.context = 'update';
        event.treatInputAsId = true;
        event.start = moment(event.start).toISOString();
        event.end = moment(event.end).toISOString();
        var context = usecaseAdapterFactory($scope);
        context.params = {
            method: 'POST',
            withCredentials: true,
            url: (config.baseUri || '') + 'api/entity/calendarevent',
            data: event
        };
        context.success = presenter.success;
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