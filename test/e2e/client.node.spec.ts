import { compileWithTypescript } from './scripts/compileWithTypescript';
import { generate } from './scripts/generate';
import server from './scripts/server';

describe('v3.node', () => {
    beforeAll(async () => {
        await generate('client/node', 'v3', 'node', false, false, 'AppClient');
        compileWithTypescript('client/node');
        await server.start('client/node');
    }, 30000);

    afterAll(async () => {
        await server.stop();
    });

    it('requests token', async () => {
        const { AppClient } = require('./generated/client/node/index.js');
        const tokenRequest = jest.fn().mockResolvedValue('MY_TOKEN');
        const client = new AppClient({
            TOKEN: tokenRequest,
            USERNAME: undefined,
            PASSWORD: undefined,
        });
        const result = await client.simple.getCallWithoutParametersAndResponse();
        expect(tokenRequest.mock.calls.length).toBe(1);
        expect(result.headers.authorization).toBe('Bearer MY_TOKEN');
    });

    it('uses credentials', async () => {
        const { AppClient } = require('./generated/client/node/index.js');
        const client = new AppClient({
            TOKEN: undefined,
            USERNAME: 'username',
            PASSWORD: 'password',
        });
        const result = await client.simple.getCallWithoutParametersAndResponse();
        expect(result.headers.authorization).toBe('Basic dXNlcm5hbWU6cGFzc3dvcmQ=');
    });

    it('supports complex params', async () => {
        const { AppClient } = require('./generated/client/node/index.js');
        const client = new AppClient();
        const result = await client.complex.complexTypes({
            first: {
                second: {
                    third: 'Hello World!',
                },
            },
        });
        expect(result).toBeDefined();
    });

    it('support form data', async () => {
        const { AppClient } = require('./generated/client/node/index.js');
        const client = new AppClient();
        const result = await client.parameters.callWithParameters(
            'valueHeader',
            'valueQuery',
            'valueForm',
            'valueCookie',
            'valuePath',
            {
                prop: 'valueBody',
            }
        );
        expect(result).toBeDefined();
    });

    it('can abort the request', async () => {
        let error;
        try {
            const { AppClient } = require('./generated/client/node/index.js');
            const client = new AppClient();
            const promise = client.simple.getCallWithoutParametersAndResponse();
            setTimeout(() => {
                promise.cancel();
            }, 10);
            await promise;
        } catch (e) {
            error = (e as Error).message;
        }
        expect(error).toContain('Request aborted');
    });

    it('should throw known error (500)', async () => {
        let error;
        try {
            const { AppClient } = require('./generated/client/node/index.js');
            const client = new AppClient();
            await client.error.testErrorCode(500);
        } catch (e) {
            const err = e as any;
            error = JSON.stringify({
                name: err.name,
                message: err.message,
                url: err.url,
                status: err.status,
                statusText: err.statusText,
                body: err.body,
            });
        }
        expect(error).toBe(
            JSON.stringify({
                name: 'ApiError',
                message: 'Custom message: Internal Server Error',
                url: 'http://localhost:3000/base/api/v1.0/error?status=500',
                status: 500,
                statusText: 'Internal Server Error',
                body: 'Internal Server Error',
            })
        );
    });

    it('should throw unknown error (409)', async () => {
        let error;
        try {
            const { AppClient } = require('./generated/client/node/index.js');
            const client = new AppClient();
            await client.error.testErrorCode(409);
        } catch (e) {
            const err = e as any;
            error = JSON.stringify({
                name: err.name,
                message: err.message,
                url: err.url,
                status: err.status,
                statusText: err.statusText,
                body: err.body,
            });
        }
        expect(error).toBe(
            JSON.stringify({
                name: 'ApiError',
                message: 'Generic Error',
                url: 'http://localhost:3000/base/api/v1.0/error?status=409',
                status: 409,
                statusText: 'Conflict',
                body: 'Conflict',
            })
        );
    });
});
