import { resultsStatics } from './results-statics';

describe('resultsStatics', () => {
  describe('kinds', () => {
    it('VALID: {kinds.all} => is exactly the six kinds, in spec order', () => {
      expect(resultsStatics.kinds.all).toStrictEqual([
        'console',
        'network',
        'ws',
        'server',
        'screenshots',
        'steps',
      ]);
    });
  });

  describe('patterns.consoleError', () => {
    it('VALID: {listenersLayerAdapter console error line} => matches', () => {
      const { source, flags } = resultsStatics.patterns.consoleError;
      const line = JSON.stringify({
        at: 1,
        kind: 'console',
        type: 'error',
        text: 'boom',
        url: 'http://example.com',
        line: 4,
      });

      expect(new RegExp(source, flags).test(line)).toBe(true);
    });

    it('VALID: {listenersLayerAdapter pageerror line} => matches', () => {
      const { source, flags } = resultsStatics.patterns.consoleError;
      const line = JSON.stringify({
        at: 1,
        kind: 'pageerror',
        type: 'error',
        text: 'uncaught',
        stack: null,
      });

      expect(new RegExp(source, flags).test(line)).toBe(true);
    });

    it('VALID: {listenersLayerAdapter console warning line} => does not match', () => {
      const { source, flags } = resultsStatics.patterns.consoleError;
      const line = JSON.stringify({
        at: 1,
        kind: 'console',
        type: 'warning',
        text: 'careful',
        url: 'http://example.com',
        line: 4,
      });

      expect(new RegExp(source, flags).test(line)).toBe(false);
    });
  });

  describe('patterns.consoleWarning', () => {
    it('VALID: {listenersLayerAdapter console warning line} => matches', () => {
      const { source, flags } = resultsStatics.patterns.consoleWarning;
      const line = JSON.stringify({
        at: 1,
        kind: 'console',
        type: 'warning',
        text: 'careful',
        url: 'http://example.com',
        line: 4,
      });

      expect(new RegExp(source, flags).test(line)).toBe(true);
    });

    it('VALID: {listenersLayerAdapter console error line} => does not match', () => {
      const { source, flags } = resultsStatics.patterns.consoleWarning;
      const line = JSON.stringify({
        at: 1,
        kind: 'console',
        type: 'error',
        text: 'boom',
        url: 'http://example.com',
        line: 4,
      });

      expect(new RegExp(source, flags).test(line)).toBe(false);
    });
  });

  describe('patterns.serverError', () => {
    it('VALID: {server log line containing "Error"} => matches', () => {
      const { source, flags } = resultsStatics.patterns.serverError;
      const line = 'Error: connect ECONNREFUSED 127.0.0.1:5173';

      expect(new RegExp(source, flags).test(line)).toBe(true);
    });

    it('VALID: {server log line with no error text} => does not match', () => {
      const { source, flags } = resultsStatics.patterns.serverError;
      const line = 'GET /api/quests 200 15ms';

      expect(new RegExp(source, flags).test(line)).toBe(false);
    });
  });

  describe('patterns.networkStatus', () => {
    it('VALID: {listenersLayerAdapter network line with a 500 status} => captures "500"', () => {
      const { source, flags } = resultsStatics.patterns.networkStatus;
      const line = JSON.stringify({
        at: 1,
        method: 'GET',
        url: 'http://example.com/api',
        resourceType: 'fetch',
        status: 500,
        requestBody: null,
        responseBody: 'boom',
      });

      expect(new RegExp(source, flags).exec(line)?.[1]).toBe('500');
    });

    it('VALID: {listenersLayerAdapter requestfailed line} => captures "null"', () => {
      const { source, flags } = resultsStatics.patterns.networkStatus;
      const line = JSON.stringify({
        at: 1,
        method: 'GET',
        url: 'http://example.com/api',
        resourceType: 'fetch',
        status: null,
        requestBody: null,
        responseBody: '<request failed: timeout>',
      });

      expect(new RegExp(source, flags).exec(line)?.[1]).toBe('null');
    });
  });
});
