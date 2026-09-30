import { runIndexComputeTransformer } from './run-index-compute-transformer';

const consoleLine = ({ type }: { type: string }): string =>
  JSON.stringify({ at: 1, kind: 'console', type, text: 'x', url: 'http://x', line: 0 });

const pageErrorLine = (): string =>
  JSON.stringify({
    at: 1,
    kind: 'pageerror',
    type: 'TypeError',
    text: 'boom',
    stack: null,
  });

const networkLine = ({ status }: { status: number | null }): string =>
  JSON.stringify({
    at: 1,
    method: 'GET',
    url: '/x',
    resourceType: 'fetch',
    status,
    requestBody: null,
    responseBody: 'ok',
  });

describe('runIndexComputeTransformer', () => {
  describe('empty window', () => {
    it('EMPTY: {no lines} => every count is zero', () => {
      const result = runIndexComputeTransformer({
        consoleLines: [],
        networkLines: [],
        serverLines: [],
      });

      expect(result).toStrictEqual({
        console: { errors: 0, warnings: 0 },
        server: { errors: 0 },
        network: { exchanges: 0, failed: 0 },
      });
    });
  });

  describe('console counting', () => {
    it('VALID: {one error, one warning, one log} => errors 1, warnings 1', () => {
      const result = runIndexComputeTransformer({
        consoleLines: [
          consoleLine({ type: 'error' }),
          consoleLine({ type: 'warning' }),
          consoleLine({ type: 'log' }),
        ],
        networkLines: [],
        serverLines: [],
      });

      expect(result.console).toStrictEqual({ errors: 1, warnings: 1 });
    });

    it('VALID: {one uncaught pageerror} => counted as a console error', () => {
      const result = runIndexComputeTransformer({
        consoleLines: [pageErrorLine()],
        networkLines: [],
        serverLines: [],
      });

      expect(result.console).toStrictEqual({ errors: 1, warnings: 0 });
    });
  });

  describe('network counting', () => {
    it('VALID: {200, 404, 500, null} => exchanges 4, failed 3', () => {
      const result = runIndexComputeTransformer({
        consoleLines: [],
        networkLines: [
          networkLine({ status: 200 }),
          networkLine({ status: 404 }),
          networkLine({ status: 500 }),
          networkLine({ status: null }),
        ],
        serverLines: [],
      });

      expect(result.network).toStrictEqual({ exchanges: 4, failed: 3 });
    });

    it('VALID: {eight 200s and one 304 cache hit} => exchanges 9, failed 0', () => {
      const result = runIndexComputeTransformer({
        consoleLines: [],
        networkLines: [
          networkLine({ status: 200 }),
          networkLine({ status: 200 }),
          networkLine({ status: 200 }),
          networkLine({ status: 200 }),
          networkLine({ status: 200 }),
          networkLine({ status: 200 }),
          networkLine({ status: 200 }),
          networkLine({ status: 200 }),
          networkLine({ status: 304 }),
        ],
        serverLines: [],
      });

      expect(result.network).toStrictEqual({ exchanges: 9, failed: 0 });
    });

    it('EDGE: {status 399 and 400} => 399 is not a failure, 400 is', () => {
      const result = runIndexComputeTransformer({
        consoleLines: [],
        networkLines: [networkLine({ status: 399 }), networkLine({ status: 400 })],
        serverLines: [],
      });

      expect(result.network).toStrictEqual({ exchanges: 2, failed: 1 });
    });
  });

  describe('server counting', () => {
    it('VALID: {two lines, one mentions an error} => server.errors is 1', () => {
      const result = runIndexComputeTransformer({
        consoleLines: [],
        networkLines: [],
        serverLines: ['[api] listening on 5051', '[api] Error: connection refused'],
      });

      expect(result.server).toStrictEqual({ errors: 1 });
    });

    it('VALID: {uppercase ERROR} => still counted, case-insensitively', () => {
      const result = runIndexComputeTransformer({
        consoleLines: [],
        networkLines: [],
        serverLines: ['FATAL ERROR: out of memory'],
      });

      expect(result.server).toStrictEqual({ errors: 1 });
    });
  });
});
