import { HttpRequestFailedError } from '../../../errors/http-request-failed/http-request-failed-error';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { StepStub } from '../../../contracts/step/step.stub';
import { stepRequestBroker } from './step-request-broker';
import { stepRequestBrokerProxy } from './step-request-broker.proxy';

type Step = ReturnType<typeof StepStub>;

describe('stepRequestBroker', () => {
  describe('successful requests', () => {
    it('VALID: {relative path with leading slash} => resolves against apiBaseUrl and returns ContentText', async () => {
      const proxy = stepRequestBrokerProxy();
      const lane = LaneSessionStub({ apiBaseUrl: 'http://127.0.0.1:34172' });
      const step = StepStub({
        step: 'request',
        method: 'GET',
        path: '/api/guilds',
      }) as Step & { step: 'request' };

      proxy.setupResponse({
        url: 'http://127.0.0.1:34172/api/guilds',
        status: 200,
        statusText: 'OK',
        body: [{ id: 'guild-1', name: 'Alpha' }],
      });

      const reading = await stepRequestBroker({ lane, step });

      expect(reading).toBe('200 OK — [{"id":"guild-1","name":"Alpha"}]');
    });

    it('VALID: {relative path without leading slash} => adds leading slash and resolves correctly', async () => {
      const proxy = stepRequestBrokerProxy();
      const lane = LaneSessionStub({ apiBaseUrl: 'http://127.0.0.1:34172' });
      const step = StepStub({
        step: 'request',
        method: 'GET',
        path: 'api/guilds',
      }) as Step & { step: 'request' };

      proxy.setupResponse({
        url: 'http://127.0.0.1:34172/api/guilds',
        status: 200,
        statusText: 'OK',
        body: { ok: true },
      });

      const reading = await stepRequestBroker({ lane, step });

      expect(reading).toBe('200 OK — {"ok":true}');
    });

    it('VALID: {apiBaseUrl with trailing slash} => normalizes without double slash', async () => {
      const proxy = stepRequestBrokerProxy();
      const lane = LaneSessionStub({ apiBaseUrl: 'http://127.0.0.1:34172/' });
      const step = StepStub({
        step: 'request',
        method: 'GET',
        path: '/api/guilds',
      }) as Step & { step: 'request' };

      proxy.setupResponse({
        url: 'http://127.0.0.1:34172/api/guilds',
        status: 200,
        statusText: 'OK',
        body: { ok: true },
      });

      const reading = await stepRequestBroker({ lane, step });

      expect(reading).toBe('200 OK — {"ok":true}');
    });

    it('VALID: {absolute https URL} => uses target URL directly without apiBaseUrl prefix', async () => {
      const proxy = stepRequestBrokerProxy();
      const lane = LaneSessionStub({ apiBaseUrl: 'http://127.0.0.1:34172' });
      const step = StepStub({
        step: 'request',
        method: 'GET',
        path: 'https://example.com/health',
      }) as Step & { step: 'request' };

      proxy.setupResponse({
        url: 'https://example.com/health',
        status: 200,
        statusText: 'OK',
        body: 'healthy',
      });

      const reading = await stepRequestBroker({ lane, step });

      expect(reading).toBe('200 OK — healthy');
    });

    it('VALID: {POST with body and headers} => executes POST and renders response', async () => {
      const proxy = stepRequestBrokerProxy();
      const lane = LaneSessionStub({ apiBaseUrl: 'http://127.0.0.1:34172' });
      const step = StepStub({
        step: 'request',
        method: 'POST',
        path: '/api/guilds',
        body: { name: 'guild-omega' },
        headers: { 'x-correlation-id': 'corr-123' },
      }) as Step & { step: 'request' };

      proxy.setupResponse({
        url: 'http://127.0.0.1:34172/api/guilds',
        status: 201,
        statusText: 'Created',
        body: { id: 'g-99', name: 'guild-omega' },
      });

      const reading = await stepRequestBroker({ lane, step });

      expect(reading).toBe('201 Created — {"id":"g-99","name":"guild-omega"}');
    });
  });

  describe('failing HTTP responses', () => {
    it('ERROR: {status 400} => throws HttpRequestFailedError with formatted details', async () => {
      const proxy = stepRequestBrokerProxy();
      const lane = LaneSessionStub({ apiBaseUrl: 'http://127.0.0.1:34172' });
      const step = StepStub({
        step: 'request',
        method: 'POST',
        path: '/api/guilds',
        body: { name: null },
      }) as Step & { step: 'request' };

      proxy.setupResponse({
        url: 'http://127.0.0.1:34172/api/guilds',
        status: 400,
        statusText: 'Bad Request',
        body: { error: 'Name must not be null' },
      });

      const promise = stepRequestBroker({ lane, step });

      await expect(promise).rejects.toThrow(HttpRequestFailedError);
      await expect(promise).rejects.toThrow(
        /HTTP 400 Bad Request from http:\/\/127\.0\.0\.1:34172\/api\/guilds: \{"error":"Name must not be null"\}/u,
      );
    });

    it('ERROR: {status 500 with string body} => throws HttpRequestFailedError with 500 status', async () => {
      const proxy = stepRequestBrokerProxy();
      const lane = LaneSessionStub({ apiBaseUrl: 'http://127.0.0.1:34172' });
      const step = StepStub({
        step: 'request',
        method: 'GET',
        path: '/api/error',
      }) as Step & { step: 'request' };

      proxy.setupResponse({
        url: 'http://127.0.0.1:34172/api/error',
        status: 500,
        statusText: 'Internal Server Error',
        body: 'database connection dropped',
      });

      const promise = stepRequestBroker({ lane, step });

      await expect(promise).rejects.toThrow(HttpRequestFailedError);
      await expect(promise).rejects.toThrow(
        /HTTP 500 Internal Server Error from http:\/\/127\.0\.0\.1:34172\/api\/error: database connection dropped/u,
      );
    });
  });
});
