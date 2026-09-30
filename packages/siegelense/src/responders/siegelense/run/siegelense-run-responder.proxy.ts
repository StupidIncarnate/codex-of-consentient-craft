/**
 * PURPOSE: Test proxy for SiegelenseRunResponder — composes `readFileProxy` (the
 * `--steps-file` disk read this responder owns) and stages a real-passthrough `resolve` (the path
 * that read resolves against), and mocks `registryReadBroker` / `instanceRunBroker` directly rather
 * than composing either broker's own child proxies' staging, matching `SiegelenseKillResponderProxy`'s
 * shape for the sibling command. All proxies are constructed unconditionally to satisfy
 * `enforce-proxy-child-creation`; a test that never names `--steps-file` never calls `readFile`, so
 * leaving it unstaged is safe. `resolve`'s real-passthrough default means an absolute `--steps-file`
 * value still resolves to itself with no extra staging.
 *
 * USAGE:
 * const proxy = SiegelenseRunResponderProxy();
 * proxy.stageRegistry({ registry });
 * proxy.stageRunResult({ result });
 * proxy.stageStepsFileContent({ filePath, content: '[{"step":"goto","path":"/"}]' });
 */

import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import type { FsError } from '#gateway/node/fs';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { resolve } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

import { instanceRunBroker } from '../../../brokers/instance/run/instance-run-broker';
import { instanceRunBrokerProxy } from '../../../brokers/instance/run/instance-run-broker.proxy';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryReadBrokerProxy } from '../../../brokers/registry/read/registry-read-broker.proxy';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import type { RunResultStub } from '../../../contracts/run-result/run-result.stub';

type Registry = ReturnType<typeof RegistryStub>;
type RunResult = ReturnType<typeof RunResultStub>;

export const SiegelenseRunResponderProxy = (): {
  stageRegistry: (params: { registry: Registry }) => void;
  stageRunResult: (params: { result: RunResult }) => void;
  stageRunThrows: (params: { error: Error; instanceId: SiegeInstance['id'] }) => void;
  stageStepsFileContent: (params: { filePath: string; content: string }) => void;
  stageStepsFileMissing: (params: { filePath: string; error: Error }) => void;
  getStdoutWrites: () => unknown[];
  getRunCallsMatching: () => RecordedCalls;
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages the two brokers
  // directly below, never through either's own setup methods.
  registryReadBrokerProxy();
  instanceRunBrokerProxy();
  // #gateway/node/path re-exports `resolve` bare (no per-function proxy of its own, unlike
  // fs/fs__promises/child_process) — mocked directly here, with the same sticky real-passthrough
  // default instance-start-broker.proxy.ts's own `join` staging uses (A12 SL7).
  const realPath = requireActual<{ resolve: typeof resolve }>({ module: 'path' });
  const resolveHandle = registerMock({ fn: resolve });
  const readFileMock = readFileProxy();

  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const instanceRunHandle = registerMock({ fn: instanceRunBroker });
  const stdout = stdoutProxy();

  return {
    stageRegistry: ({ registry }: { registry: Registry }): void => {
      registryReadHandle.calledWith([]).resolves(registry);
    },

    stageRunResult: ({ result }: { result: RunResult }): void => {
      instanceRunHandle.calledWith([{ instanceId: result.instanceId }]).resolves(result);
    },

    stageRunThrows: ({
      error,
      instanceId,
    }: {
      error: Error;
      instanceId: SiegeInstance['id'];
    }): void => {
      instanceRunHandle.calledWith([{ instanceId }]).rejects(error);
    },

    stageStepsFileContent: ({ filePath, content }: { filePath: string; content: string }): void => {
      resolveHandle
        .calledWith([filePath])
        .implement((...segments: never[]) => realPath.resolve(...segments));
      readFileMock.returns({ path: filePath, contents: content });
    },

    stageStepsFileMissing: ({ filePath, error }: { filePath: string; error: Error }): void => {
      const fsError: FsError = Object.assign(error, {
        code: 'code' in error && typeof error.code === 'string' ? error.code : 'ENOENT',
      });
      resolveHandle
        .calledWith([filePath])
        .implement((...segments: never[]) => realPath.resolve(...segments));
      readFileMock.throwsMatchingPath({ path: filePath, error: fsError });
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],

    getRunCallsMatching: (): RecordedCalls => instanceRunHandle.callsMatching([]),
  };
};
