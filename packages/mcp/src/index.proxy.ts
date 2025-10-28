/**
 * Proxy for testing index.ts entry point
 * Mocks process.exit and process.stderr to test error handling
 *
 * NOTE: Nested functions allowed in proxies per testing standards
 * Uses jest.spyOn for global objects (process) per standards
 */

export const indexProxy = (): {
  captureProcessInteractions: () => {
    exitSpy: jest.SpyInstance;
    stderrSpy: jest.SpyInstance;
  };
  loadIndexWithStartupBehavior: (startMcpServerBehavior: () => Promise<void>) => void;
} => {
  /**
   * Capture process.exit and process.stderr calls for testing error handling
   * Returns spies that are automatically restored by @questmaestro/testing
   */
  const captureProcessInteractions = (): {
    exitSpy: jest.SpyInstance;
    stderrSpy: jest.SpyInstance;
  } => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      // Prevent actual process exit in tests
    }) as never);
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    return { exitSpy, stderrSpy };
  };

  /**
   * Load index with custom StartMcpServer behavior to test entry point
   * Uses jest.isolateModules to prevent module cache pollution
   */
  const loadIndexWithStartupBehavior = (startMcpServerBehavior: () => Promise<void>): void => {
    jest.isolateModules(() => {
      jest.doMock('./startup/start-mcp-server.js', () => ({
        StartMcpServer: jest.fn(startMcpServerBehavior),
      }));

      require('./index.js');
    });
  };

  return {
    captureProcessInteractions,
    loadIndexWithStartupBehavior,
  };
};
