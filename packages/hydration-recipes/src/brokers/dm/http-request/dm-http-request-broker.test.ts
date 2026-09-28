import { dmHttpRequestBroker } from './dm-http-request-broker';
import { dmHttpRequestBrokerProxy } from './dm-http-request-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';

describe('dmHttpRequestBroker', () => {
  describe('a target carrying a request function', () => {
    it('VALID: {target.request, method, path} => routes through target.request and never calls fetch', async () => {
      dmHttpRequestBrokerProxy();
      const response = DmHttpResponseStub({ status: 201, body: { id: 'f47ac10b' } });
      const request = async (): Promise<typeof response> => Promise.resolve(response);
      const target = DmTargetStub({
        baseUrl: 'http://app.in-process',
        request,
      });

      const result = await dmHttpRequestBroker({ target, method: 'POST', path: '/api/guilds' });

      expect(result).toStrictEqual({ status: 201, body: { id: 'f47ac10b' } });
    });

    it('VALID: {target.request, body} => hands the body through to target.request', async () => {
      dmHttpRequestBrokerProxy();
      const calls: unknown[] = [];
      const target = DmTargetStub({
        baseUrl: 'http://app.in-process',
        request: async (args: { method: string; path: string; body?: unknown }) => {
          calls.push(args);
          return Promise.resolve(DmHttpResponseStub({ status: 200 }));
        },
      });

      await dmHttpRequestBroker({
        target,
        method: 'POST',
        path: '/api/quests',
        body: { title: 'Quest 1' },
      });

      expect(calls).toStrictEqual([
        { method: 'POST', path: '/api/quests', body: { title: 'Quest 1' } },
      ]);
    });
  });

  describe('a target with no request function', () => {
    it('VALID: {baseUrl, no request} => fetches against baseUrl and returns status + body', async () => {
      const proxy = dmHttpRequestBrokerProxy();
      const target = DmTargetStub({ baseUrl: 'http://app.in-process' });
      proxy.succeeds({
        url: 'http://app.in-process/api/guilds',
        response: DmHttpResponseStub({ status: 201, body: { id: 'f47ac10b' } }),
      });

      const result = await dmHttpRequestBroker({ target, method: 'POST', path: '/api/guilds' });

      expect(result).toStrictEqual({ status: 201, body: { id: 'f47ac10b' } });
    });
  });

  describe('a target with neither a request function nor a baseUrl', () => {
    it('ERROR: {no request, no baseUrl} => throws naming the method and path', async () => {
      dmHttpRequestBrokerProxy();
      const target = DmTargetStub({});

      await expect(
        dmHttpRequestBroker({ target, method: 'GET', path: '/api/guilds' }),
      ).rejects.toThrow(
        /dmHttpRequestBroker: target carries no request function and no baseUrl for GET \/api\/guilds/u,
      );
    });
  });
});
