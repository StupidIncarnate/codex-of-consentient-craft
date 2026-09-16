import { z } from 'zod';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { StepCandidate } from '../../../contracts/step-candidate/step-candidate-contract';

// browserSessionContract carries no MatchCount export of its own (contracts/ exposes only the
// inferred type) — the same local re-declaration browser-session.stub.ts already uses to brand a
// count for its own default.
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();

export const stepTargetResolveBrokerProxy = (): {
  sessionWithOneMatch: () => BrowserSession;
  sessionWithCandidates: (params: { candidates: readonly StepCandidate[] }) => BrowserSession;
  sessionWithNearest: (params: { nearest: readonly ContentText[] }) => BrowserSession;
  sessionNarrowingWithin: (params: {
    unscopedCandidates: readonly StepCandidate[];
  }) => BrowserSession;
} => ({
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

  sessionWithNearest: ({ nearest }: { nearest: readonly ContentText[] }): BrowserSession =>
    BrowserSessionStub({
      countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(0)),
      nearestNames: jest.fn().mockResolvedValue(nearest),
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
});
