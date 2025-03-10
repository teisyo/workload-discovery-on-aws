const {assert} = require('chai');
const createAppSync = require('../../src/lib/apiClient/appSync');
const {createApiClient} = require('../../src/lib/apiClient');
const {setGlobalDispatcher, getGlobalDispatcher} = require('undici');
const {createSuccessThenError} = require('../mocks/agents/utils');
const ConnectionClosedAgent = require('../mocks/agents/ConnectionClosed');
const GetDbResourcesMapPagination = require('../mocks/agents/GetDbResourcesMapPagination');
const GetDbRelationshipsMapPagination = require('../mocks/agents/GetDbRelationshipsMapPagination');
const GenericError = require('../mocks/agents/GenericError');
const {
    CONTAINS
} = require("../../src/lib/constants");

describe('persistence/index.js', () => {

    let globalDispatcher = null;
    before(() => {
        globalDispatcher = getGlobalDispatcher();
    });

    const appSync = createAppSync({graphgQlUrl: 'https://www.workload-discovery/graphql'});
    const apiClient = createApiClient(appSync);

    describe('error', () => {

        it('should recover from premature connection closed error', async () => {

            setGlobalDispatcher(ConnectionClosedAgent)
            const actual = await apiClient.storeRelationships({concurrency:10, batchSize:10}, [{
                source: 'sourceArn',
                target: 'targetArn',
                label: CONTAINS
            }]);
            assert.deepEqual(actual, {
                errors: [],
                results: [
                    []
                ]
            });
        });

    });

    describe('getDbResourcesMap', () => {

        it('should page through server results', async () => {

            setGlobalDispatcher(GetDbResourcesMapPagination)
            const actual = await apiClient.getDbResourcesMap();
            assert.deepEqual(actual, new Map([['arn1', {
                id: 'arn1',
                label: 'label',
                md5Hash: '',
                properties: {
                    id: 'arn1',
                    resourceId: 'resourceId1',
                    resourceName: 'resourceName1',
                    resourceType: 'AWS::Lambda::Function',
                    accountId: 'xxxxxxxxxxxx',
                    arn: 'arn1',
                    awsRegion: 'eu-west-1',
                    relationships: [],
                    tags: [],
                    configuration: {
                        a: 1
                    }
                }
            }]]));
        });

    });

    describe('getDbRelationshipsMap', () => {

        it('should page through server results', async () => {

            setGlobalDispatcher(GetDbRelationshipsMapPagination)
            const actual = await apiClient.getDbRelationshipsMap();
            assert.deepEqual(actual, new Map([['sourceArn_Contains _targetArn', {
                id: 'testId',
                source: 'sourceArn',
                target: 'targetArn',
                label: CONTAINS
            }]]));
        });

    });

    describe('storeResources', () => {

        it('should handle errors in first db write', async () => {
            setGlobalDispatcher(GenericError);
            const actual = await apiClient.storeResources({concurrency:10, batchSize:10}, [{}]);
            assert.strictEqual(actual.errors[0].message, "[{\"message\":\"Validation error\"}]");
        });

        it('should handle errors in second db write', async () => {
            setGlobalDispatcher(createSuccessThenError({
                data: {
                    storeResources: []
                }
            }, "Validation error"));
            const actual = await apiClient.storeResources({concurrency:10, batchSize:10}, [{}]);
            assert.strictEqual(actual.errors[0].message, "[{\"message\":\"Validation error\"}]");
        });

    });

    describe('deleteResources', () => {

        it('should handle errors in first db write', async () => {
            setGlobalDispatcher(GenericError);
            const actual = await apiClient.deleteResources({concurrency:10, batchSize:10}, [{}]);
            assert.strictEqual(actual.errors[0].message, "[{\"message\":\"Validation error\"}]");
        });

        it('should handle errors in second db write', async () => {
            setGlobalDispatcher(createSuccessThenError({
                data: {
                    deleteResources: []
                }
            }, "Validation error"));
            const actual = await apiClient.deleteResources({concurrency:10, batchSize:10}, [{}]);
            assert.strictEqual(actual.errors[0].message, "[{\"message\":\"Validation error\"}]");
        });

    });

    describe('updateResources', () => {

        it('should handle errors in first db write', async () => {
            setGlobalDispatcher(GenericError);
            const actual = await apiClient.updateResources({concurrency:10, batchSize:10}, [{}]);
            assert.strictEqual(actual.errors[0].message, "[{\"message\":\"Validation error\"}]");
        });

        it('should handle errors in second db write', async () => {
            setGlobalDispatcher(createSuccessThenError({
                data: {
                    updateResources: []
                }
            }, "Validation error"));
            const actual = await apiClient.updateResources({concurrency: 10, batchSize: 10}, [{}]);
            assert.strictEqual(actual.errors[0].message, "[{\"message\":\"Validation error\"}]");
        });

    });

    describe('deleteRelationships', () => {

        it('should handle errors', async () => {
            setGlobalDispatcher(GenericError);
            const actual = await apiClient.deleteRelationships({concurrency:10, batchSize:10}, [{}]);
            assert.strictEqual(actual.errors[0].message, "[{\"message\":\"Validation error\"}]");
        });

    });

    describe('updateAccountsCrawledTime', () => {

        it('should handle errors', async () => {
            setGlobalDispatcher(GenericError);
            const actual = await apiClient.updateAccountsCrawledTime(['xxxxxxxxxxxx']);
            assert.strictEqual(actual.errors[0].message, "[{\"message\":\"Validation error\"}]");
        });

    });

    after(() => {
        setGlobalDispatcher(globalDispatcher);
    })

});