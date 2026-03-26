import * as directoryBrowseBrokerModule from '../../brokers/directory/browse/directory-browse-broker';

import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { directoryBrowseBrokerProxy } from '../../brokers/directory/browse/directory-browse-broker.proxy';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

const createPoisonError = (): Error => {
  const error = new Error('poison');
  Object.setPrototypeOf(error, Object.prototype);
  Object.defineProperty(error, 'toString', {
    value: (): never => {
      throw new Error('poison toString');
    },
  });

  return error;
};

const rejectWithPoisonToString = async (): Promise<never> => {
  await Promise.resolve();
  throw createPoisonError();
};

export const useDirectoryBrowserBindingProxy = (): {
  setupEntries: (params: { entries: DirectoryEntry[] }) => void;
  setupError: () => void;
  setupOuterCatchTrigger: () => void;
  getConsoleErrorCalls: () => SpyOnHandle['mock']['calls'];
} => {
  const brokerProxy = directoryBrowseBrokerProxy();
  const consoleErrorHandle = registerSpyOn({ object: globalThis.console, method: 'error' });

  return {
    setupEntries: ({ entries }: { entries: DirectoryEntry[] }): void => {
      brokerProxy.setupEntries({ entries });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
    setupOuterCatchTrigger: (): void => {
      const brokerHandle = registerSpyOn({
        object: directoryBrowseBrokerModule,
        method: 'directoryBrowseBroker',
      });
      brokerHandle.mockImplementation(rejectWithPoisonToString as never);
    },
    getConsoleErrorCalls: (): SpyOnHandle['mock']['calls'] => consoleErrorHandle.mock.calls,
  };
};
