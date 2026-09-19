// PURPOSE: Builds a BrowserSession whose `readStorage` is a jest.fn(), and exposes its call list
// so a test can assert the exact `{prefix}` stepStorageBroker drove it with.
// USAGE: const proxy = stepStorageBrokerProxy(); const { session, getReadStorageCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { StorageReadingStub } from '../../../contracts/storage-reading/storage-reading.stub';

type BrowserSession = ReturnType<typeof BrowserSessionStub>;

export const stepStorageBrokerProxy = (): {
  session: (params?: { reading?: unknown }) => {
    session: BrowserSession;
    getReadStorageCalls: () => readonly unknown[];
  };
} => ({
  session: (params?: {
    reading?: unknown;
  }): {
    session: BrowserSession;
    getReadStorageCalls: () => readonly unknown[];
  } => {
    const stagedReading =
      params?.reading === undefined ? StorageReadingStub() : (params.reading as never);
    const readStorage = jest.fn().mockResolvedValue(stagedReading);

    return {
      session: BrowserSessionStub({ readStorage }),
      getReadStorageCalls: (): readonly unknown[] => readStorage.mock.calls,
    };
  },
});
