import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentSpawnUnifiedBrokerProxy } from '../spawn-unified/agent-spawn-unified-broker.proxy';

export const agentSpawnByRoleBrokerProxy = (): {
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnAutoLines: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnceLazy: () => void;
  setupSpawnFailure: () => void;
  setupSpawnFailureOnce: () => void;
  setupSpawnExitOnKill: (params: { lines: readonly string[]; exitCode: ExitCode | null }) => void;
  getSpawnedArgs: () => unknown;
  setupStderrCapture: () => jest.SpyInstance;
} => {
  const unifiedProxy = agentSpawnUnifiedBrokerProxy();

  return {
    setupSpawnAndMonitor: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      // Set default config so all spawn calls auto-exit with this exitCode
      unifiedProxy.setupSuccessConfig({ exitCode });

      // Emit lines through readline mock so unified broker's onLine handler processes them
      if (lines.length > 0) {
        setImmediate(() => {
          unifiedProxy.emitLines({ lines });
        });
      }
    },

    setupSpawnOnce: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      // Use mockReturnValueOnce so this spawn takes priority over later mockImplementation calls
      unifiedProxy.setupSpawnAndEmitLines({ lines, exitCode });
    },

    setupSpawnAutoLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      // Set default config so all spawn calls auto-exit with this exitCode
      unifiedProxy.setupSuccessConfig({ exitCode });
      // Auto-emit lines per readline interface creation
      unifiedProxy.setAutoEmitLines({ lines });
    },

    setupSpawnOnceLazy: (): void => {
      unifiedProxy.setupSpawnOnceLazy();
    },

    setupSpawnFailure: (): void => {
      unifiedProxy.setupSpawnThrow({ error: new Error('spawn claude ENOENT') });
    },

    setupSpawnFailureOnce: (): void => {
      unifiedProxy.setupSpawnThrowOnce({ error: new Error('spawn claude ENOENT') });
    },

    setupSpawnExitOnKill: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode | null;
    }): void => {
      unifiedProxy.setupSpawnExitOnKill({ lines, exitCode });
    },

    getSpawnedArgs: (): unknown => unifiedProxy.getSpawnedArgs(),

    setupStderrCapture: (): jest.SpyInstance =>
      jest.spyOn(process.stderr, 'write').mockImplementation(() => true),
  };
};
