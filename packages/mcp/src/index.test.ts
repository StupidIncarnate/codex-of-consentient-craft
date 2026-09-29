/**
 * Tests for index.ts - MCP server entry point
 * Testing the error handling wrapper around StartMcpServer
 */

import { indexProxy } from './index.proxy';

describe('index', () => {
  describe('entry point error handling', () => {
    it('VALID: StartMcpServer succeeds => process continues', async () => {
      const proxy = indexProxy();

      await proxy.loadIndexWithStartupBehavior(async () => {
        // Success - no error thrown
      });

      expect(proxy.getExitCalls()).toStrictEqual([]);
      expect(proxy.getStderrWrites()).toStrictEqual([]);
    });

    it('ERROR: StartMcpServer throws Error => writes to stderr and exits with code 1', async () => {
      const proxy = indexProxy();

      const testError = new Error('Test server error');

      await proxy.loadIndexWithStartupBehavior(async () => {
        return Promise.reject(testError);
      });

      expect(proxy.getStderrWrites()).toStrictEqual(['MCP server error: Test server error\n']);
      expect(proxy.getExitCalls()).toStrictEqual([[1]]);
    });

    it('ERROR: StartMcpServer throws non-Error object => writes stringified error to stderr and exits with code 1', async () => {
      const proxy = indexProxy();

      // Test non-Error throw case - throw Error containing string representation
      const stringError = new Error('String error');

      await proxy.loadIndexWithStartupBehavior(async () => {
        return Promise.reject(stringError);
      });

      expect(proxy.getStderrWrites()).toStrictEqual(['MCP server error: String error\n']);
      expect(proxy.getExitCalls()).toStrictEqual([[1]]);
    });

    it('VALID: {SIGTERM signal} => exits with code 0', async () => {
      const proxy = indexProxy();

      await proxy.loadIndexWithStartupBehavior(async () => {});

      proxy.simulateSignal({ signal: 'SIGTERM' });

      expect(proxy.getExitCalls()).toStrictEqual([[0]]);
    });

    it('VALID: {SIGINT signal} => exits with code 0', async () => {
      const proxy = indexProxy();

      await proxy.loadIndexWithStartupBehavior(async () => {});

      proxy.simulateSignal({ signal: 'SIGINT' });

      expect(proxy.getExitCalls()).toStrictEqual([[0]]);
    });
  });
});
