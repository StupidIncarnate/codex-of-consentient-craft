import { httpReadinessPollAdapter } from './http-readiness-poll-adapter';
import { httpReadinessPollAdapterProxy } from './http-readiness-poll-adapter.proxy';

const POLL_URL = 'http://localhost:3000/';

describe('httpReadinessPollAdapter', () => {
  describe('immediate success', () => {
    it('VALID: {url responds 200 immediately} => returns ready: true', async () => {
      const proxy = httpReadinessPollAdapterProxy();
      proxy.respondsWithStatus({ url: POLL_URL, status: 200, ok: true });

      const result = await httpReadinessPollAdapter({
        url: POLL_URL,
        timeoutMs: 5000,
        intervalMs: 0,
      });

      expect(result.ready).toBe(true);
    });

    it('VALID: {url responds 404} => returns ready: true (non-server-error)', async () => {
      const proxy = httpReadinessPollAdapterProxy();
      proxy.respondsWithStatus({ url: POLL_URL, status: 404, ok: false });

      const result = await httpReadinessPollAdapter({
        url: POLL_URL,
        timeoutMs: 5000,
        intervalMs: 0,
      });

      expect(result.ready).toBe(true);
    });

    it('VALID: {url responds 200} => elapsedMs is a non-negative number', async () => {
      const proxy = httpReadinessPollAdapterProxy();
      proxy.respondsWithStatus({ url: POLL_URL, status: 200, ok: true });

      const result = await httpReadinessPollAdapter({
        url: POLL_URL,
        timeoutMs: 5000,
        intervalMs: 0,
      });

      expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('server error responses', () => {
    it('VALID: {url responds 500 then 200} => retries and returns ready: true', async () => {
      const proxy = httpReadinessPollAdapterProxy();
      proxy.respondsWithStatuses({
        url: POLL_URL,
        statuses: [
          { status: 500, ok: false },
          { status: 200, ok: true },
        ],
      });

      const result = await httpReadinessPollAdapter({
        url: POLL_URL,
        timeoutMs: 5000,
        intervalMs: 0,
      });

      expect(result.ready).toBe(true);
    });

    it('VALID: {url responds 503 then 200} => retries and returns ready: true', async () => {
      const proxy = httpReadinessPollAdapterProxy();
      proxy.respondsWithStatuses({
        url: POLL_URL,
        statuses: [
          { status: 503, ok: false },
          { status: 200, ok: true },
        ],
      });

      const result = await httpReadinessPollAdapter({
        url: POLL_URL,
        timeoutMs: 5000,
        intervalMs: 0,
      });

      expect(result.ready).toBe(true);
    });
  });

  describe('network errors', () => {
    it('VALID: {network error then 200} => retries after error and returns ready: true', async () => {
      const proxy = httpReadinessPollAdapterProxy();
      proxy.throwsNetworkError({ url: POLL_URL, error: new Error('ECONNREFUSED') });
      proxy.respondsWithStatus({ url: POLL_URL, status: 200, ok: true });

      const result = await httpReadinessPollAdapter({
        url: POLL_URL,
        timeoutMs: 5000,
        intervalMs: 0,
      });

      expect(result.ready).toBe(true);
    });
  });

  describe('timeout', () => {
    it('VALID: {timeout 0, server 500} => returns ready: false immediately', async () => {
      const proxy = httpReadinessPollAdapterProxy();
      proxy.respondsWithStatus({ url: POLL_URL, status: 500, ok: false });

      const result = await httpReadinessPollAdapter({
        url: POLL_URL,
        timeoutMs: 0,
        intervalMs: 0,
      });

      expect(result.ready).toBe(false);
    });

    it('VALID: {timeout exceeded after retry} => returns ready: false with non-negative elapsedMs', async () => {
      const proxy = httpReadinessPollAdapterProxy();
      proxy.respondsWithStatus({ url: POLL_URL, status: 500, ok: false });

      const result = await httpReadinessPollAdapter({
        url: POLL_URL,
        timeoutMs: 0,
        intervalMs: 0,
      });

      expect(result).toStrictEqual({
        ready: false,
        elapsedMs: 100,
      });
    });
  });

  describe('abort signal', () => {
    it('VALID: {aborted signal before poll} => returns ready: false without fetching', async () => {
      httpReadinessPollAdapterProxy();
      const controller = new AbortController();
      controller.abort();

      const result = await httpReadinessPollAdapter({
        url: POLL_URL,
        timeoutMs: 5000,
        intervalMs: 0,
        abortSignal: controller.signal,
      });

      expect(result.ready).toBe(false);
    });
  });
});
