describe('calendar.events.rest', function() {
    var writer, source, deleter, updater, request, response;
    var usecaseAdapter;
    var context;
    var rest;
    var configStub;
    var $scope;

    beforeEach(module('calendar.events.sources'));
    beforeEach(module('angular.usecase.adapter'));
    beforeEach(module('rest.client'));
    beforeEach(module('config'));

    beforeEach(inject(function($rootScope, usecaseAdapterFactory, restServiceHandler, config) {
        context = {};
        request = {};
        response = {};
        usecaseAdapter = usecaseAdapterFactory;
        usecaseAdapter.and.returnValue(context);
        rest = restServiceHandler;
        configStub = config;
        $scope = $rootScope.$new();
    }));

    describe('given an event writer', function() {
        beforeEach(inject(function(calendarEventWriter) {
            writer = calendarEventWriter;
            configStub.baseUri = 'base-uri/';
        }));

        describe('when writing', function() {
            var event = {};
            var start = moment(1).format();
            var end = moment(1).format();

            beforeEach(function() {
                event.start = start;
                event.end = end;
            });

            describe('with presenter', function () {
                var presenter = jasmine.createSpyObj('presenter', ['success']);

                beforeEach(function() {
                    writer(event, $scope, presenter);
                });

                it('then context is created', function() {
                    expect(usecaseAdapter.calls.argsFor(0)[0]).toEqual($scope);
                });

                it('and context is populated with rest params', function() {
                    expect(context.params.method).toEqual('PUT');
                    expect(context.params.withCredentials).toBeTruthy();
                    expect(context.params.url).toEqual('base-uri/api/entity/calendarevent');
                    expect(context.params.data).toEqual(event);
                    expect(context.params.data.start).toEqual(moment(start).toISOString());
                    expect(context.params.data.end).toEqual(moment(end).toISOString());
                });

                it('and rest call is executed', function() {
                    expect(rest.calls.argsFor(0)[0]).toEqual(context);
                });

                describe('on success', function() {
                    beforeEach(function() {
                        context.success();
                    });

                    it('then event is fired', function() {
                        expect(presenter.success.calls.argsFor(0)).toBeDefined();
                    })
                });
            });

            describe('without presenter', function () {
                beforeEach(function() {
                    writer(event, $scope, undefined);
                });

                it('context has no success handler', function () {
                    expect(context.success).toBeUndefined();
                });
            });
        });
    });

    describe('calendar event gateway', function() {
        var gateway, events;

        beforeEach(inject(function(calendarEventGateway) {
            gateway = calendarEventGateway;

            configStub.baseUri = 'http://example.org/';
            configStub.namespace = 'n';
        }));

        describe('find all between start date and end date', function() {
            beforeEach(function() {
                response.success = function(it) {
                    events = it;
                };

                gateway.findAllBetweenStartDateAndEndDate({
                    type:'t',
                    startDate:moment().year(2016).month(4).date(1),
                    endDate:moment().year(2016).month(5).date(1)
                }, response);
                request = rest.calls.argsFor(0)[0];
            });

            it('performs rest call', function() {
                expect(request.params.method).toEqual('POST');
                expect(request.params.url).toEqual('http://example.org/api/usecase');
                expect(request.params.data.headers.namespace).toEqual('n');
                expect(request.params.data.headers.usecase).toEqual('find.all.calendar.events.between.start.date.and.end.date');
                expect(request.params.data.payload.type).toEqual('t');
                expect(request.params.data.payload.startDate).toEqual('2016-05-01');
                expect(request.params.data.payload.endDate).toEqual('2016-06-01');
            });

            it('on success events are passed to the response', function() {
                request.success('events');
                expect(events).toEqual('events');
            });
        });
    });

    describe('given an event source', function() {
        var start, end;
        var presenter = jasmine.createSpy('presenter');

        beforeEach(inject(function(calendarEventSourceFactory) {
            source = calendarEventSourceFactory({id:'type'});
            configStub.baseUri = 'base-uri/';
            configStub.namespace = 'namespace';
        }));

        describe('when reading', function() {
            beforeEach(function() {
                start = moment();
                end = start.add('days', 1);
                source({start: start, end: end, presenter: presenter});
            });

            it('then context is created', function() {
                expect(usecaseAdapter.calls.argsFor(0)[0]).toEqual({});
            });

            it('and context is populated with rest params', function() {
                expect(context.params.method).toEqual('POST');
                expect(context.params.url).toEqual('base-uri/api/query/calendarevent/findBetween');
                expect(context.params.data.args.type).toEqual('type');
                expect(context.params.data.args.start).toEqual(start);
                expect(context.params.data.args.end).toEqual(end);
                expect(context.params.data.args.namespace).toEqual(configStub.namespace);
            });

            it('then rest call is executed', function() {
                expect(rest.calls.argsFor(0)[0]).toEqual(context);
            });

            describe('on success', function() {
                var payload, start, end;

                beforeEach(function() {
                    start = moment().format();
                    end = moment().add('hour', 1).format();
                    payload = [{
                        start:start,
                        end:end
                    }];
                    context.success(payload);
                });

                it('call presenter', function() {
                    expect(presenter.calls.argsFor(0)[0]).toEqual(payload);
                });

                it('convert date strings to moment.js', function() {
                    expect(presenter.calls.argsFor(0)[0][0].start.format()).toEqual(start);
                    expect(presenter.calls.argsFor(0)[0][0].end.format()).toEqual(end);
                });
            })
        });
    });

    describe('given an event deleter', function() {

        beforeEach(inject(function(calendarEventDeleter) {
            deleter = calendarEventDeleter;
            configStub.baseUri = 'base-uri/';
        }));

        describe('when deleting', function() {
            var success = jasmine.createSpy('success');
            beforeEach(function() {
                deleter({id:'id'}, {success: success});
            });

            it('then context is created', function() {
                expect(usecaseAdapter.calls.argsFor(0)[0]).toEqual({});
            });

            it('and context is populated with rest params', function() {
                expect(context.params.method).toEqual('DELETE');
                expect(context.params.withCredentials).toBeTruthy();
                expect(context.params.url).toEqual('base-uri/api/entity/calendarevent/id');
            });

            it('and rest call is executed', function() {
                expect(rest.calls.argsFor(0)[0]).toEqual(context);
            });

            it('success callback is provided by presenter', function() {
                expect(context.success).toEqual(success);
            });
        });
    });

    describe('given an event updater', function() {
        beforeEach(inject(function(calendarEventUpdater, config) {
            updater = calendarEventUpdater;
            config.baseUri = 'base-uri/';
        }));

        describe('when updating', function() {
            var event;
            var start = moment().format(), end = moment().format();
            var success = jasmine.createSpy('success');

            beforeEach(function() {
                event = {
                    id:'id',
                    start: start,
                    end: end
                };
                updater(event, $scope, {success:success});
            });

            it('context is created', function() {
                expect(usecaseAdapter.calls.argsFor(0)[0]).toEqual($scope);
            });

            it('http params are configured', function() {
                expect(context.params.method).toEqual('POST');
                expect(context.params.withCredentials).toBeTruthy();
                expect(context.params.url).toEqual('base-uri/api/entity/calendarevent');
                expect(context.params.data).toEqual(event);
                expect(context.params.data.start).toEqual(moment(start).toISOString());
                expect(context.params.data.end).toEqual(moment(end).toISOString());
                expect(context.params.data.context).toEqual('update');
                expect(context.params.data.treatInputAsId).toEqual(true);
            });

            it('http call is executed', function() {
                expect(rest.calls.argsFor(0)[0]).toEqual(context);
            });

            it('test', function() {
                expect(context.success).toEqual(success);
            });
        });
    });

    describe('given an event viewer', function() {
        var viewer;
        var id;

        beforeEach(inject(function(calendarEventViewer, config) {
            id = 'id';
            config.baseUri = 'base-uri/';
            config.namespace = 'namespace';
            viewer = calendarEventViewer;
            viewer(id, $scope);
        }));

        it('then context is created', function() {
            expect(usecaseAdapter.calls.argsFor(0)[0]).toEqual($scope);
        });

        it('http params are populated', function() {
            expect(context.params.method).toEqual('GET');
            expect(context.params.headers['x-namespace']).toEqual('namespace');
            expect(context.params.url).toEqual('base-uri/api/entity/calendarevent/'+id);
        });

        it('http call is executec', function() {
            expect(rest.calls.argsFor(0)[0]).toEqual(context);
        });

        describe('on success', function() {
            var payload;

            beforeEach(function() {
                payload = {};
                context.success(payload);
            });

            it('payload gets put on scope as event', function() {
                expect($scope.event).toEqual(payload);
            })
        });
    });
});