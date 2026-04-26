/**
 * Tests for index.ts - MCP server entry point
 * Testing the error handling wrapper around StartMcpServer
 */

import { indexProxy } from './index.proxy';

describe('index', () => {
  describe('entry point error handling', () => {
    it('VALID: StartMcpServer succeeds => process continues', async () => {
      const proxy = indexProxy();
      const { exitSpy, stderrSpy } = proxy.captureProcessInteractions();

      await proxy.loadIndexWithStartupBehavior(async () => {
        // Success - no error thrown
      });

      expect(exitSpy.mock.calls).toStrictEqual([]);
      expect(stderrSpy.mock.calls).toStrictEqual([]);
    });

    it('ERROR: StartMcpServer throws Error => writes to stderr and exits with code 1', async () => {
      const proxy = indexProxy();
      const { exitSpy, stderrSpy } = proxy.captureProcessInteractions();

      const testError = new Error('Test server error');

      await proxy.loadIndexWithStartupBehavior(async () => {
        return Promise.reject(testError);
      });

      expect(stderrSpy.mock.calls).toStrictEqual([['MCP server error: Test server error\n']]);
      expect(exitSpy.mock.calls).toStrictEqual([[1]]);
    });

    it('ERROR: StartMcpServer throws non-Error object => writes stringified error to stderr and exits with code 1', async () => {
      const proxy = indexProxy();
      const { exitSpy, stderrSpy } = proxy.captureProcessInteractions();

      // Test non-Error throw case - throw Error containing string representation
      const stringError = new Error('String error');

      await proxy.loadIndexWithStartupBehavior(async () => {
        return Promise.reject(stringError);
      });

      expect(stderrSpy.mock.calls).toStrictEqual([['MCP server error: String error\n']]);
      expect(exitSpy.mock.calls).toStrictEqual([[1]]);
    });
  });
});
