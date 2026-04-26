/**
 * Proxy for testing index.ts entry point
 * Mocks process.exit and process.stderr to test error handling
 *
 * NOTE: Nested functions allowed in proxies per testing standards
 * Uses registerSpyOn for global objects (process) per standards
 */

import { resolve } from 'path';
import { registerSpyOn, isolateModules } from '@dungeonmaster/testing/register-mock';
import type { IsolateModulesMock, SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const indexProxy = (): {
  captureProcessInteractions: () => {
    exitSpy: SpyOnHandle;
    stderrSpy: SpyOnHandle;
  };
  loadIndexWithStartupBehavior: (startMcpServerBehavior: () => Promise<void>) => Promise<void>;
} => {
  /**
   * Capture process.exit and process.stderr calls for testing error handling
   * Returns spies that are automatically restored by @dungeonmaster/testing
   */
  const captureProcessInteractions = (): {
    exitSpy: SpyOnHandle;
    stderrSpy: SpyOnHandle;
  } => {
    const exitSpy = registerSpyOn({ object: process, method: 'exit', passthrough: true });

    exitSpy.mockImplementation((() => {
      // Prevent actual process exit in tests
    }) as never);
    const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write', passthrough: true });

    stderrSpy.mockImplementation((() => true) as never);

    return { exitSpy, stderrSpy };
  };

  /**
   * Load index with custom StartMcpServer behavior to test entry point
   * Uses isolateModules to prevent module cache pollution
   */
  const loadIndexWithStartupBehavior = async (
    startMcpServerBehavior: () => Promise<void>,
  ): Promise<void> => {
    type ModulePath = IsolateModulesMock['module'];

    await isolateModules({
      mocks: [
        {
          module: resolve(__dirname, './startup/start-mcp-server') as ModulePath,
          factory: () => ({
            StartMcpServer: startMcpServerBehavior,
          }),
        },
      ],
      entrypoint: resolve(__dirname, './index') as ModulePath,
    });
  };

  return {
    captureProcessInteractions,
    loadIndexWithStartupBehavior,
  };
};
