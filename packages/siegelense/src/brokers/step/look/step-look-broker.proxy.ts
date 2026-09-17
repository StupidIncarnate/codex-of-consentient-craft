// PURPOSE: Builds a BrowserSession whose `look` is a jest.fn() returning a KeyListing the test
// chose, and exposes its call list so a test can assert the exact `within` scope the broker
// normalised and drove with.
// USAGE: const proxy = stepLookBrokerProxy(); const { session, getLookCalls } = proxy.session({ listing });

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { KeyListingStub } from '../../../contracts/key-listing/key-listing.stub';

type KeyListing = ReturnType<typeof KeyListingStub>;

export const stepLookBrokerProxy = (): {
  session: (params: { listing: KeyListing }) => {
    session: BrowserSession;
    getLookCalls: () => readonly unknown[];
  };
} => ({
  session: ({
    listing,
  }: {
    listing: KeyListing;
  }): { session: BrowserSession; getLookCalls: () => readonly unknown[] } => {
    const look = jest.fn().mockResolvedValue(listing);
    return {
      session: BrowserSessionStub({ look }),
      getLookCalls: (): readonly unknown[] => look.mock.calls,
    };
  },
});
