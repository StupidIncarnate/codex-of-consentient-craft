import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';

export const commandRawBrokerProxy = (): {
  setupWithResult: (params: { content: string }) => void;
  setupNoResult: () => void;
} => {
  // write()'s return value never varies by content, and this proxy exposes no reader over what
  // was written (tests assert directly on the spy), so the catch-all stays unaddressed.
  registerSpyOn({ object: process.stdout, method: 'write' }).calledWith([]).returns(true);
  registerSpyOn({ object: process.stderr, method: 'write' }).calledWith([]).returns(true);

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
  };
};
