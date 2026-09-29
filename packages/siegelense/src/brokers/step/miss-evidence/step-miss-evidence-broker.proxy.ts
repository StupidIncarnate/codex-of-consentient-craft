import type { ContentText } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { KeyListingStub } from '../../../contracts/key-listing/key-listing.stub';

type KeyListing = ReturnType<typeof KeyListingStub>;

export const stepMissEvidenceBrokerProxy = (): {
  sessionWith: (params: { names: readonly ContentText[]; listing: KeyListing }) => BrowserSession;
  sessionWithFailedLook: (params: {
    names: readonly ContentText[];
    error: Error;
  }) => BrowserSession;
  sessionWithFailedNames: (params: { error: Error }) => BrowserSession;
} => ({
  sessionWith: ({
    names,
    listing,
  }: {
    names: readonly ContentText[];
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
    names: readonly ContentText[];
    error: Error;
  }): BrowserSession => {
    // The degraded read is logged; swallowed here so the test output stays clean.
    registerSpyOn({ object: process.stderr, method: 'write' }).calledWith([]).returns(true);
    return BrowserSessionStub({
      nearestNames: jest.fn().mockResolvedValue(names),
      look: jest.fn().mockRejectedValue(error),
    });
  },

  sessionWithFailedNames: ({ error }: { error: Error }): BrowserSession =>
    BrowserSessionStub({
      nearestNames: jest.fn().mockRejectedValue(error),
    }),
});
