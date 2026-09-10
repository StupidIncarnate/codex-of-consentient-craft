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

      expect(String(stderrOutput[0])).toMatch(
        /^\[network-record\] response body read failed:.*body read failed\n$/u,
      );
    });
  });

  describe('settling reads at the end of a test', () => {
    it('VALID: {body read lands after the test body} => dump waits for it and records the body', async () => {
      const proxy = networkRecordPlaywrightBrokerProxy();

      const recorder = networkRecordPlaywrightBroker({
        page: proxy.getPage() as never,
      });

      const requestIdentity = jest.fn() as never;

      proxy.fireRequest({
        url: 'http://localhost/api/test',
        method: 'GET',
        postData: null,
        requestIdentity,
      });

      // The read is still outstanding when the response event returns, exactly as a real protocol
      // round trip to the browser is, and it lands only after the test body would have finished.
      proxy.fireResponse({
        url: 'http://localhost/api/test',
        method: 'GET',
        status: 200,
        hasCapturableBody: true,
        text: () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve('{"ok":true}');
            }, 0);
          }) as never,
        requestIdentity,
      });

      expect(recorder.getEntries()[0]?.responseBody).toBe(undefined);

      // A PASSING test, so dump prints nothing — the settle has to happen ahead of that early
      // return, or the read outlives the spec that started it.
      await recorder.dump({
        testInfo: { status: 'passed', expectedStatus: 'passed' } as never,
      });

      expect(recorder.getEntries()[0]?.responseBody).toBe('{"ok":true}');
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
