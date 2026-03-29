import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';

export const commandListBrokerProxy = (): {
  setupWithResult: (params: { content: string }) => void;
  setupNoResult: () => void;
  getStdoutCalls: () => unknown[][];
  getStderrCalls: () => unknown[][];
} => {
  const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

  const storageProxy = storageLoadBrokerProxy();

  return {
    setupWithResult: ({ content }: { content: string }): void => {
      storageProxy.setupRunById({ content });
    },
    setupNoResult: (): void => {
      storageProxy.setupReadFail({ error: new Error('ENOENT') });
    },
    getStdoutCalls: (): unknown[][] => stdoutSpy.mock.calls,
    getStderrCalls: (): unknown[][] => stderrSpy.mock.calls,
  };
};
