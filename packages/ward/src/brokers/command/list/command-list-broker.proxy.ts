import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';

export const commandListBrokerProxy = (): {
  setupWithResult: (params: { content: string }) => void;
  setupNoResult: () => void;
  getStdoutCalls: () => RecordedCalls;
  getStderrCalls: () => RecordedCalls;
} => {
  const stdout = stdoutProxy();
  const stderr = stderrProxy();

  const storageProxy = storageLoadBrokerProxy();
  // Every test in this file exercises rootPath '/project' and the default RunIdStub().
  const rootPath = AbsoluteFilePathStub({ value: '/project' });
  const runId = RunIdStub();

  return {
    setupWithResult: ({ content }: { content: string }): void => {
      storageProxy.setupRunById({ rootPath, runId, content });
    },
    setupNoResult: (): void => {
      storageProxy.setupReadFail({ rootPath, runId });
    },
    getStdoutCalls: (): RecordedCalls => stdout.getWrites().map((chunk) => [chunk]),
    getStderrCalls: (): RecordedCalls => stderr.getWrites().map((chunk) => [chunk]),
  };
};
