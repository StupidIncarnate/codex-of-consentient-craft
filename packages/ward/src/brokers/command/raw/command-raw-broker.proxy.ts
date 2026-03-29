import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';

export const commandRawBrokerProxy = (): {
  setupWithResult: (params: { content: string }) => void;
  setupNoResult: () => void;
} => {
  registerSpyOn({ object: process.stdout, method: 'write' }).mockImplementation(() => true);
  registerSpyOn({ object: process.stderr, method: 'write' }).mockImplementation(() => true);

  const storageProxy = storageLoadBrokerProxy();

  return {
    setupWithResult: ({ content }: { content: string }): void => {
      storageProxy.setupRunById({ content });
    },
    setupNoResult: (): void => {
      storageProxy.setupReadFail({ error: new Error('ENOENT') });
    },
  };
};
