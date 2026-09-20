/**
 * PURPOSE: Test proxy for SiegelenseRunResponder — composes `fsReadFileAdapterProxy` (the
 * `--steps-file` disk read this responder owns) and `pathResolveAdapterProxy` (the path that read
 * resolves against), and mocks `registryReadBroker` / `instanceRunBroker` directly rather than
 * composing either broker's own child proxies' staging, matching `SiegelenseKillResponderProxy`'s
 * shape for the sibling command. All four's own `.proxy.ts` are constructed unconditionally to
 * satisfy `enforce-proxy-child-creation`; a test that never names `--steps-file` never calls
 * `readFile`, so leaving it unstaged is safe. `pathResolveAdapterProxy` keeps its own default real
 * passthrough, so an absolute `--steps-file` value still resolves to itself with no extra staging.
 *
 * USAGE:
 * const proxy = SiegelenseRunResponderProxy();
 * proxy.stageRegistry({ registry });
 * proxy.stageRunResult({ result });
 * proxy.stageStepsFileContent({ filePath, content: '[{"step":"goto","path":"/"}]' });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { pathResolveAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
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
  stageRunThrows: (params: { error: Error }) => void;
  stageStepsFileContent: (params: { filePath: AbsoluteFilePath; content: string }) => void;
  stageStepsFileMissing: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  getStdoutWrites: () => unknown[];
  getRunCallsMatching: () => RecordedCalls;
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages the two brokers
  // directly below, never through either's own setup methods.
  registryReadBrokerProxy();
  instanceRunBrokerProxy();
  pathResolveAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const instanceRunHandle = registerMock({ fn: instanceRunBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageRegistry: ({ registry }: { registry: Registry }): void => {
      registryReadHandle.calledWith([]).resolves(registry);
    },

    stageRunResult: ({ result }: { result: RunResult }): void => {
      instanceRunHandle.calledWith([]).resolves(result);
    },

    stageRunThrows: ({ error }: { error: Error }): void => {
      instanceRunHandle.calledWith([]).rejects(error);
    },

    stageStepsFileContent: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: string;
    }): void => {
      readFileProxy.resolves({ filePath, content });
    },

    stageStepsFileMissing: ({
      filePath,
      error,
    }: {
      filePath: AbsoluteFilePath;
      error: Error;
    }): void => {
      readFileProxy.rejects({ filePath, error });
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),

    getRunCallsMatching: (): RecordedCalls => instanceRunHandle.callsMatching([]),
  };
};
