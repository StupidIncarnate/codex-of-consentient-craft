import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';

export const commandDetailBrokerProxy = (): {
  setupWithResult: (params: { content: string }) => void;
  setupNoResult: () => void;
  getStdoutCalls: () => unknown[];
  getStderrCalls: () => unknown[];
} => {
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.mockImplementation(() => true);
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.mockImplementation(() => true);

  const storageProxy = storageLoadBrokerProxy();

  return {
    setupWithResult: ({ content }: { content: string }): void => {
      storageProxy.setupRunById({ content });
    },
    setupNoResult: (): void => {
      storageProxy.setupReadFail({ error: new Error('ENOENT') });
    },
    getStdoutCalls: (): unknown[] => stdoutSpy.mock.calls.map((call) => call[0]),
    getStderrCalls: (): unknown[] => stderrSpy.mock.calls.map((call) => call[0]),
  };
};
