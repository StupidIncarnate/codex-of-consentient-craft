import * as directoryBrowseBrokerModule from '../../brokers/directory/browse/directory-browse-broker';

import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
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
  getConsoleErrorCalls: () => unknown[][];
} => {
  const brokerProxy = directoryBrowseBrokerProxy();
  // passthrough: true — console.error is a shared sink; React's own internal warnings (e.g. act()
  // warnings) also flow through it and must keep printing normally, not throw for being unstaged.
  const consoleErrorHandle = registerSpyOn({
    object: globalThis.console,
    method: 'error',
    passthrough: true,
  });
  consoleErrorHandle.calledWith(['[use-directory-browser]']).returns(undefined);

  return {
    setupEntries: ({ entries }: { entries: DirectoryEntry[] }): void => {
      brokerProxy.setupEntries({ entries });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
    setupOuterCatchTrigger: (): void => {
      const brokerHandle: MockHandle = registerSpyOn({
        object: directoryBrowseBrokerModule,
        method: 'directoryBrowseBroker',
      });
      // The outer-catch path is exercised on the binding's initial mount, before any navigation:
      // browse() always calls directoryBrowseBroker({}) at that point (currentPath is still
      // null), so {} is the real call shape here — not a stand-in for "match anything."
      brokerHandle.calledWith([{}]).implement(rejectWithPoisonToString as never);
    },
    getConsoleErrorCalls: (): unknown[][] => consoleErrorHandle.callsMatching([]),
  };
};
