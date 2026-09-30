import { z } from '#gateway/npm/zod';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { stepMissEvidenceBrokerProxy } from '../miss-evidence/step-miss-evidence-broker.proxy';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { RefResolutionStub } from '../../../contracts/ref-resolution/ref-resolution.stub';
import type { StepCandidate } from '../../../contracts/step-candidate/step-candidate-contract';

// browserSessionContract carries no MatchCount export of its own (contracts/ exposes only the
// inferred type) — the same local re-declaration browser-session.stub.ts already uses to brand a
// count for its own default.
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();

export const stepTargetResolveBrokerProxy = (): {
  sessionWithOneMatch: () => BrowserSession;
  sessionWithCandidates: (params: { candidates: readonly StepCandidate[] }) => BrowserSession;
  sessionWithNearest: (params: { nearest: readonly string[] }) => BrowserSession;
  sessionWithFailedLookup: (params: { error: Error }) => BrowserSession;
  sessionNarrowingWithin: (params: {
    unscopedCandidates: readonly StepCandidate[];
  }) => BrowserSession;
  sessionWithLiveRef: () => BrowserSession;
  sessionWithStaleRef: (params: { boundary: string }) => BrowserSession;
  sessionWithUnknownRef: (params: { highestMinted: number }) => BrowserSession;
} => {
  // The child broker drives the session this proxy hands out; it mocks nothing of its own.
  stepMissEvidenceBrokerProxy();

  return {
    sessionWithOneMatch: (): BrowserSession =>
      BrowserSessionStub({
        countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(1)),
      }),

    sessionWithCandidates: ({
      candidates,
    }: {
      candidates: readonly StepCandidate[];
    }): BrowserSession =>
      BrowserSessionStub({
        countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(candidates.length)),
        describeMatches: jest.fn().mockResolvedValue(candidates),
      }),

    sessionWithNearest: ({ nearest }: { nearest: readonly string[] }): BrowserSession =>
      BrowserSessionStub({
        countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(0)),
        nearestNames: jest.fn().mockResolvedValue(nearest),
      }),

    // A genuine lookup failure (the near-miss read itself rejects) is distinct from a zero-match
    // page with no near misses — the caller must be able to tell "nothing similar" apart from
    // "could not find out". `nearestNames` rejecting must surface as itself, never wrapped as a
    // StepNoMatchError the failure never actually computed.
    sessionWithFailedLookup: ({ error }: { error: Error }): BrowserSession =>
      BrowserSessionStub({
        countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(0)),
        nearestNames: jest.fn().mockRejectedValue(error),
      }),

    sessionNarrowingWithin: ({
      unscopedCandidates,
    }: {
      unscopedCandidates: readonly StepCandidate[];
    }): BrowserSession =>
      BrowserSessionStub({
        countMatches: jest
          .fn()
          .mockImplementation(async ({ within }: { within?: string }) =>
            Promise.resolve(
              matchCountContract.parse(within === undefined ? unscopedCandidates.length : 1),
            ),
          ),
        describeMatches: jest.fn().mockResolvedValue(unscopedCandidates),
      }),

    sessionWithLiveRef: (): BrowserSession =>
      BrowserSessionStub({
        refState: jest
          .fn()
          .mockResolvedValue(
            RefResolutionStub({ state: 'live', boundary: null, highestMinted: 41 }),
          ),
      }),

    sessionWithStaleRef: ({ boundary }: { boundary: string }): BrowserSession =>
      BrowserSessionStub({
        refState: jest
          .fn()
          .mockResolvedValue(RefResolutionStub({ state: 'stale', boundary, highestMinted: 41 })),
      }),

    sessionWithUnknownRef: ({ highestMinted }: { highestMinted: number }): BrowserSession =>
      BrowserSessionStub({
        refState: jest
          .fn()
          .mockResolvedValue(
            RefResolutionStub({ state: 'unknown', boundary: null, highestMinted }),
          ),
      }),
  };
};
