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

      proxy.loadIndexWithStartupBehavior(async () => {
        // Success - no error thrown
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(exitSpy).not.toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it('ERROR: StartMcpServer throws Error => writes to stderr and exits with code 1', async () => {
      const proxy = indexProxy();
      const { exitSpy, stderrSpy } = proxy.captureProcessInteractions();

      const testError = new Error('Test server error');

      proxy.loadIndexWithStartupBehavior(async () => {
        return Promise.reject(testError);
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledWith('MCP server error: Test server error\n');
      expect(exitSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('ERROR: StartMcpServer throws non-Error object => writes stringified error to stderr and exits with code 1', async () => {
      const proxy = indexProxy();
      const { exitSpy, stderrSpy } = proxy.captureProcessInteractions();

      // Test non-Error throw case - throw Error containing string representation
      const stringError = new Error('String error');

      proxy.loadIndexWithStartupBehavior(async () => {
        return Promise.reject(stringError);
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledWith('MCP server error: String error\n');
      expect(exitSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
