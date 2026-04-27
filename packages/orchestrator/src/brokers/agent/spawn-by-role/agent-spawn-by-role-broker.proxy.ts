import { repoRootCwdContract, type ExitCode } from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  claudeLineNormalizeBrokerProxy,
  cwdResolveBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { signalFromSessionJsonlBrokerProxy } from '../../signal/from-session-jsonl/signal-from-session-jsonl-broker.proxy';
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
  getSpawnedOptions: () => unknown;
  setupStderrCapture: () => SpyOnHandle;
  setupConfigRoot: (params: { root: string }) => void;
  setupConfigRootRejection: (params: { error: Error }) => void;
  getConfigRootCalls: () => readonly unknown[][];
  setupSessionJsonlContent: (params: { content: string }) => void;
  setupSessionJsonlMissing: () => void;
} => {
  claudeLineNormalizeBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  const unifiedProxy = agentSpawnUnifiedBrokerProxy();
  // Wires the disk-fallback signal extractor's adapter (fsReadJsonlAdapter -> readFile).
  // The underlying fsReadJsonlAdapterProxy defaults to empty content, so spawns that resolve
  // with sessionId !== null && signal === null produce signal: null from the disk fallback
  // unless a test overrides via setupSessionJsonlContent / setupSessionJsonlMissing.
  const sessionJsonlProxy = signalFromSessionJsonlBrokerProxy();
  // Every spawn walks up from `startPath` to the repo root (directory containing
  // `.dungeonmaster.json`) via `cwdResolveBroker({ kind: 'repo-root' })`. Mock the broker
  // directly so tests can assert the resolved cwd without threading fs.access / path.join
  // expectations through every spawn case. Default to resolving with a placeholder absolute
  // path so cases that don't care about cwd still produce a parseable RepoRootCwd.
  const configRootMock: MockHandle = registerMock({ fn: cwdResolveBroker });
  configRootMock.mockResolvedValue(repoRootCwdContract.parse('/project'));

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

    getSpawnedOptions: (): unknown => unifiedProxy.getSpawnedOptions(),

    setupStderrCapture: (): SpyOnHandle => {
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      handle.mockImplementation(() => true);
      return handle;
    },

    setupConfigRoot: ({ root }: { root: string }): void => {
      configRootMock.mockResolvedValue(repoRootCwdContract.parse(root));
    },

    setupConfigRootRejection: ({ error }: { error: Error }): void => {
      configRootMock.mockImplementation(async () => Promise.reject(error));
    },

    getConfigRootCalls: (): readonly unknown[][] => configRootMock.mock.calls,

    setupSessionJsonlContent: ({ content }: { content: string }): void => {
      sessionJsonlProxy.setupFileContent({ content });
    },

    setupSessionJsonlMissing: (): void => {
      sessionJsonlProxy.setupFileNotFound();
    },
  };
};
