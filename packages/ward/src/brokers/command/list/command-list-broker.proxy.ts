import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';

export const commandListBrokerProxy = (): {
  setupWithResult: (params: { content: string }) => void;
  setupNoResult: () => void;
  getStdoutCalls: () => unknown[][];
  getStderrCalls: () => unknown[][];
} => {
  // write()'s return value never varies by content — what was written is read back via
  // callsMatching below, so the catch-all stays unaddressed.
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.calledWith([]).returns(true);
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.calledWith([]).returns(true);

  const storageProxy = storageLoadBrokerProxy();
  // Every test in this file exercises rootPath '/project' and the default RunIdStub().
  const rootPath = AbsoluteFilePathStub({ value: '/project' });
  const runId = RunIdStub();

  return {
    setupWithResult: ({ content }: { content: string }): void => {
      storageProxy.setupRunById({ rootPath, runId, content });
    },
    setupNoResult: (): void => {
      storageProxy.setupReadFail({ rootPath, runId, error: new Error('ENOENT') });
    },
    getStdoutCalls: (): unknown[][] => stdoutSpy.callsMatching([]),
    getStderrCalls: (): unknown[][] => stderrSpy.callsMatching([]),
  };
};
