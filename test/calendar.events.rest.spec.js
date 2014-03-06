describe('calendar.events.rest', function() {
    var writer, source, deleter, updater;
    var usecaseAdapter;
    var context;
    var rest;
    var configStub;
    var dispatcher;
    var $scope;

    beforeEach(module('calendar.events.sources'));
    beforeEach(module('angular.usecase.adapter'));
    beforeEach(module('rest.client'));
    beforeEach(module('config'));
    beforeEach(module('notifications'));

    beforeEach(inject(function($rootScope, usecaseAdapterFactory, restServiceHandler, config, topicMessageDispatcherMock) {
        context = {};
        usecaseAdapter = usecaseAdapterFactory;
        usecaseAdapter.andReturn(context);
        rest = restServiceHandler;
        configStub = config;
        dispatcher = topicMessageDispatcherMock;
        $scope = $rootScope.$new();
    }));

    describe('given an event writer', function() {
        beforeEach(inject(function(calendarEventWriter) {
            writer = calendarEventWriter;
            configStub.baseUri = 'base-uri/';
        }));

        describe('when writing', function() {
            var event = {};
            var start = moment(1).toString();
            var end = moment(1).toString();
            beforeEach(function() {
                event.start = start;
                event.end = end;
                writer(event, $scope);
            });

            it('then context is created', function() {
                expect(usecaseAdapter.calls[0].args[0]).toEqual($scope);
            });

            it('and context is populated with rest params', function() {
                expect(context.params.method).toEqual('PUT');
                expect(context.params.withCredentials).toBeTruthy();
                expect(context.params.url).toEqual('base-uri/api/entity/calendarevent');
                expect(context.params.data).toEqual(event);
                expect(context.params.data.start.toString()).toEqual(start);
                expect(context.params.data.end.toString()).toEqual(end);
            });

            it('and rest call is executed', function() {
                expect(rest.calls[0].args[0]).toEqual(context);
            });

            describe('on success', function() {
                beforeEach(function() {
                    context.success();
                });

                it('then event is fired', function() {
                    expect(dispatcher['calendar.event.created']).toEqual('success');
                })
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
                expect(usecaseAdapter.calls[0].args[0]).toEqual({});
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
                expect(rest.calls[0].args[0]).toEqual(context);
            });

            it('on success call presenter', function() {
                var payload = {};
                context.success(payload);
                expect(presenter.calls[0].args[0]).toEqual(payload);
            })
        });
    });

    describe('given an event deleter', function() {
        beforeEach(inject(function(calendarEventDeleter) {
            deleter = calendarEventDeleter;
            configStub.baseUri = 'base-uri/';
        }));

        describe('when deleting', function() {
            beforeEach(function() {
                deleter({id:'id'});
            });

            it('then context is created', function() {
                expect(usecaseAdapter.calls[0].args[0]).toEqual({});
            });

            it('and context is populated with rest params', function() {
                expect(context.params.method).toEqual('DELETE');
                expect(context.params.withCredentials).toBeTruthy();
                expect(context.params.url).toEqual('base-uri/api/entity/calendarevent/id');
            });

            it('and rest call is executed', function() {
                expect(rest.calls[0].args[0]).toEqual(context);
            });

            describe('on success', function() {
                beforeEach(function() {
                    context.success();
                });

                it('test', function() {
                    expect(dispatcher['calendar.event.removed']).toEqual('success');
                })
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

            beforeEach(function() {
                event = {id:'id'};
                updater(event);
            });

            it('context is created', function() {
                expect(usecaseAdapter.calls[0].args[0]).toEqual({});
            });

            it('http params are configured', function() {
                expect(context.params.method).toEqual('POST');
                expect(context.params.withCredentials).toBeTruthy();
                expect(context.params.url).toEqual('base-uri/api/entity/calendarevent');
                expect(context.params.data).toEqual(event);
                expect(context.params.data.context).toEqual('update');
            });

            it('http call is executed', function() {
                expect(rest.calls[0].args[0]).toEqual(context);
            });

            describe('on success', function() {
                beforeEach(function() {
                    context.success();
                });

                it('then event is fired', inject(function(topicMessageDispatcherMock) {
                    expect(topicMessageDispatcherMock['calendar.event.updated']).toEqual('success');
                }));
            });
        });
    });
});