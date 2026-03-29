import { networkRecordPlaywrightBroker } from './network-record-playwright-broker';
import { networkRecordPlaywrightBrokerProxy } from './network-record-playwright-broker.proxy';

describe('networkRecordPlaywrightBroker', () => {
  describe('fire-and-forget resilience', () => {
    it('VALID: {response.text() rejects} => logs error to stderr, does not throw', async () => {
      const proxy = networkRecordPlaywrightBrokerProxy();
      proxy.setupStderrCapture();

      networkRecordPlaywrightBroker({
        page: proxy.getPage() as never,
      });

      const requestIdentity = jest.fn() as never;

      // Register a request so the response has a matching entry
      proxy.fireRequest({
        url: 'http://localhost/api/test',
        method: 'GET',
        postData: null,
        requestIdentity,
      });

      // Fire response with text() that rejects
      proxy.fireResponse({
        url: 'http://localhost/api/test',
        method: 'GET',
        status: 200,
        hasCapturableBody: true,
        text: () => Promise.reject(new Error('body read failed')) as never,
        requestIdentity,
      });

      // Wait for microtask (promise rejection + .catch handler)
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      const stderrOutput = proxy.getStderrWrites();
      const hasNetworkRecordLog = stderrOutput.some((line) =>
        String(line).includes('[network-record] response body read failed'),
      );

      expect(hasNetworkRecordLog).toBe(true);
    });
  });

  describe('initialization', () => {
    it('VALID: {page} => returns recorder with dump, getEntries, getWsEntries', () => {
      networkRecordPlaywrightBrokerProxy();

      const recorder = networkRecordPlaywrightBroker({
        page: { on: () => undefined } as never,
      });

      expect(recorder).toStrictEqual({
        dump: expect.any(Function),
        getEntries: expect.any(Function),
        getWsEntries: expect.any(Function),
      });
    });

    it('VALID: {page} => getEntries returns empty array initially', () => {
      networkRecordPlaywrightBrokerProxy();

      const recorder = networkRecordPlaywrightBroker({
        page: { on: () => undefined } as never,
      });

      expect(recorder.getEntries()).toStrictEqual([]);
    });

    it('VALID: {page} => getWsEntries returns empty array initially', () => {
      networkRecordPlaywrightBrokerProxy();

      const recorder = networkRecordPlaywrightBroker({
        page: { on: () => undefined } as never,
      });

      expect(recorder.getWsEntries()).toStrictEqual([]);
    });
  });
});
