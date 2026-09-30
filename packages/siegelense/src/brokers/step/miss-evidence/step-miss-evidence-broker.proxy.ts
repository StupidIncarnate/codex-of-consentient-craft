import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { KeyListingStub } from '../../../contracts/key-listing/key-listing.stub';

type KeyListing = ReturnType<typeof KeyListingStub>;

export const stepMissEvidenceBrokerProxy = (): {
  sessionWith: (params: { names: readonly string[]; listing: KeyListing }) => BrowserSession;
  sessionWithFailedLook: (params: { names: readonly string[]; error: Error }) => BrowserSession;
  sessionWithFailedNames: (params: { error: Error }) => BrowserSession;
} => {
  // The degraded read is logged; the gateway proxy swallows it so the test output stays clean.
  stderrProxy();

  return {
    sessionWith: ({
      names,
      listing,
    }: {
      names: readonly string[];
      listing: KeyListing;
    }): BrowserSession =>
      BrowserSessionStub({
        nearestNames: jest.fn().mockResolvedValue(names),
        look: jest.fn().mockResolvedValue(listing),
      }),

    sessionWithFailedLook: ({
      names,
      error,
    }: {
      names: readonly string[];
      error: Error;
    }): BrowserSession =>
      BrowserSessionStub({
        nearestNames: jest.fn().mockResolvedValue(names),
        look: jest.fn().mockRejectedValue(error),
      }),

    sessionWithFailedNames: ({ error }: { error: Error }): BrowserSession =>
      BrowserSessionStub({
        nearestNames: jest.fn().mockRejectedValue(error),
      }),
  };
};
