import { repoRootCwdContract, type ExitCode } from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { signalFromSessionJsonlBrokerProxy } from '../../signal/from-session-jsonl/signal-from-session-jsonl-broker.proxy';
import { agentLaunchBrokerProxy } from '../launch/agent-launch-broker.proxy';

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
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  const launchProxy = agentLaunchBrokerProxy();
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
      launchProxy.setupSpawnSuccess({ exitCode });

      if (lines.length > 0) {
        setImmediate(() => {
          launchProxy.emitLines({ lines });
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
      launchProxy.setupSpawnAndEmitLines({ lines, exitCode });
    },

    setupSpawnAutoLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      launchProxy.setupSpawnSuccess({ exitCode });
      launchProxy.setAutoEmitLines({ lines });
    },

    setupSpawnOnceLazy: (): void => {
      launchProxy.setupSpawnLazy();
    },

    setupSpawnFailure: (): void => {
      launchProxy.setupSpawnThrow({ error: new Error('spawn claude ENOENT') });
    },

    setupSpawnFailureOnce: (): void => {
      launchProxy.setupSpawnThrowOnce({ error: new Error('spawn claude ENOENT') });
    },

    setupSpawnExitOnKill: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode | null;
    }): void => {
      launchProxy.setupSpawnExitOnKill({ lines, exitCode });
    },

    getSpawnedArgs: (): unknown => launchProxy.getSpawnedArgs(),

    getSpawnedOptions: (): unknown => launchProxy.getSpawnedOptions(),

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
