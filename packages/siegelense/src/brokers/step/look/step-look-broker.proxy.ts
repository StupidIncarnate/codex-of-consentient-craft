// PURPOSE: Builds a BrowserSession whose `look` is a jest.fn() returning a KeyListing the test
// chose, and exposes its call list so a test can assert the exact `within` scope the broker
// normalised and drove with.
// `sessionWithScroll` also answers the scroll-geometry read with the reading a test chose.
// USAGE: const proxy = stepLookBrokerProxy(); const { session, getLookCalls } = proxy.session({ listing });

import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { KeyListingStub } from '../../../contracts/key-listing/key-listing.stub';
import type { ScrollReadingStub } from '../../../contracts/scroll-reading/scroll-reading.stub';
import { stepScrollReadBrokerProxy } from '../scroll-read/step-scroll-read-broker.proxy';

type KeyListing = ReturnType<typeof KeyListingStub>;
type ScrollReading = ReturnType<typeof ScrollReadingStub>;

export const stepLookBrokerProxy = (): {
  session: (params: { listing: KeyListing }) => {
    session: BrowserSession;
    getLookCalls: () => readonly unknown[];
  };
  sessionWithScroll: (params: { listing: KeyListing; reading: ScrollReading }) => {
    session: BrowserSession;
  };
} => {
  stepScrollReadBrokerProxy();

  return {
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
    sessionWithScroll: ({
      listing,
      reading,
    }: {
      listing: KeyListing;
      reading: ScrollReading;
    }): { session: BrowserSession } => {
      const look = jest.fn().mockResolvedValue(listing);
      const evaluateSource = jest
        .fn()
        .mockResolvedValue(ContentTextStub({ value: JSON.stringify(reading) }));
      return { session: BrowserSessionStub({ look, evaluateSource }) };
    },
  };
};
