import { networkRecordCaptureBroker } from './network-record-capture-broker';
import { networkRecordCaptureBrokerProxy } from './network-record-capture-broker.proxy';
import { mswServerAdapter } from '../../../adapters/msw/server/msw-server-adapter';
import { mswHttpAdapter } from '../../../adapters/msw/http/msw-http-adapter';

describe('networkRecordCaptureBroker', () => {
  describe('start and capture', () => {
    it('VALID: {mocked GET request} => captures method, url, source', async () => {
      networkRecordCaptureBrokerProxy();
      const { http, HttpResponse } = mswHttpAdapter();
      const server = mswServerAdapter();
      server.use(http.get('http://test.local/api/guilds', () => HttpResponse.json({ id: '1' })));

      const recorder = networkRecordCaptureBroker();
      recorder.start();

      await fetch('http://test.local/api/guilds');
      await recorder.flush();

      const entries = recorder.getEntries();
      recorder.stop();

      expect(entries[0]?.method).toBe('GET');
      expect(entries[0]?.url).toBe('http://test.local/api/guilds');
      expect(entries[0]?.source).toBe('mock');
    });

    it('VALID: {mocked GET request} => captures status and response body', async () => {
      networkRecordCaptureBrokerProxy();
      const { http, HttpResponse } = mswHttpAdapter();
      const server = mswServerAdapter();
      server.use(http.get('http://test.local/api/guilds-2', () => HttpResponse.json({ id: '2' })));

      const recorder = networkRecordCaptureBroker();
      recorder.start();

      await fetch('http://test.local/api/guilds-2');
      await recorder.flush();

      const entries = recorder.getEntries();
      recorder.stop();

      expect(entries[0]?.status).toBe(200);
      expect(entries[0]?.responseBody).toBe('{"id":"2"}');
    });

    it('VALID: {mocked POST with body} => captures request body', async () => {
      networkRecordCaptureBrokerProxy();
      const { http, HttpResponse } = mswHttpAdapter();
      const server = mswServerAdapter();
      server.use(
        http.post('http://test.local/api/quests', () =>
          HttpResponse.json({ created: true }, { status: 201 }),
        ),
      );

      const recorder = networkRecordCaptureBroker();
      recorder.start();

      await fetch('http://test.local/api/quests', {
        method: 'POST',
        body: '{"title":"Fix bug"}',
      });
      await recorder.flush();

      const entries = recorder.getEntries();
      recorder.stop();

      expect(entries[0]?.requestBody).toBe('{"title":"Fix bug"}');
      expect(entries[0]?.status).toBe(201);
      expect(entries[0]?.source).toBe('mock');
    });
  });

  describe('clear', () => {
    it('VALID: {entries exist then clear} => removes all entries', async () => {
      networkRecordCaptureBrokerProxy();
      const { http, HttpResponse } = mswHttpAdapter();
      const server = mswServerAdapter();
      server.use(http.get('http://test.local/api/sessions', () => HttpResponse.json([])));

      const recorder = networkRecordCaptureBroker();
      recorder.start();

      await fetch('http://test.local/api/sessions');
      await recorder.flush();

      recorder.clear();

      expect(recorder.getEntries()).toStrictEqual([]);
    });
  });

  describe('stop', () => {
    it('VALID: {stop then request} => does not capture after stop', async () => {
      networkRecordCaptureBrokerProxy();
      const { http, HttpResponse } = mswHttpAdapter();
      const server = mswServerAdapter();
      server.use(http.get('http://test.local/api/test', () => HttpResponse.json({ ok: true })));

      const recorder = networkRecordCaptureBroker();
      recorder.start();
      recorder.stop();

      await fetch('http://test.local/api/test');

      expect(recorder.getEntries()).toStrictEqual([]);
    });
  });

  describe('getEntries', () => {
    it('VALID: {multiple requests} => captures entries for each request', async () => {
      networkRecordCaptureBrokerProxy();
      const { http, HttpResponse } = mswHttpAdapter();
      const server = mswServerAdapter();
      server.use(
        http.get('http://test.local/api/first', () => HttpResponse.json({ n: 1 })),
        http.get('http://test.local/api/second', () => HttpResponse.json({ n: 2 })),
      );

      const recorder = networkRecordCaptureBroker();
      recorder.start();

      await fetch('http://test.local/api/first');
      await fetch('http://test.local/api/second');
      await recorder.flush();

      const entries = recorder.getEntries();
      recorder.stop();

      expect(entries[0]?.url).toBe('http://test.local/api/first');
      expect(entries[1]?.url).toBe('http://test.local/api/second');
    });

    it('VALID: {getEntries} => returns a copy not a reference', async () => {
      networkRecordCaptureBrokerProxy();
      const { http, HttpResponse } = mswHttpAdapter();
      const server = mswServerAdapter();
      server.use(http.get('http://test.local/api/copy', () => HttpResponse.json({})));

      const recorder = networkRecordCaptureBroker();
      recorder.start();

      await fetch('http://test.local/api/copy');
      await recorder.flush();

      const entries1 = recorder.getEntries();
      const entries2 = recorder.getEntries();
      recorder.stop();

      expect(entries1).not.toBe(entries2);
    });
  });
});
