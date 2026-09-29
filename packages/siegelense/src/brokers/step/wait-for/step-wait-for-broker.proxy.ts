// PURPOSE: Builds a BrowserSession whose `waitForMatch` is a jest.fn(), staged to either resolve or
// hit its ceiling (reject), plus a `waitForSettle` jest.fn() staged to settle promptly or never, and
// exposes both call lists so a test can assert the exact `{target, within?, state, timeoutMs}`
// step-wait-for-broker drove `waitForMatch` with and what it waited on afterward.
// USAGE: const proxy = stepWaitForBrokerProxy(); const { session } = proxy.sessionResolving();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { SettleReadingStub } from '../../../contracts/settle-reading/settle-reading.stub';
import type { StepCandidateStub } from '../../../contracts/step-candidate/step-candidate.stub';

type StepCandidate = ReturnType<typeof StepCandidateStub>;

export const stepWaitForBrokerProxy = (): {
  sessionResolving: () => {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
  sessionResolvingNeverSettling: () => {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
  sessionMatchingTwice: (params: { candidates: readonly StepCandidate[] }) => {
    session: BrowserSession;
    getDescribeMatchesCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
  sessionHittingCeiling: () => {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
} => ({
  sessionResolving: (): {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const waitForMatch = jest.fn().mockResolvedValue(undefined);
    const waitForSettle = jest.fn().mockResolvedValue(SettleReadingStub());
    return {
      session: BrowserSessionStub({ waitForMatch, waitForSettle }),
      getWaitForMatchCalls: (): readonly unknown[] => waitForMatch.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },

  sessionResolvingNeverSettling: (): {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const waitForMatch = jest.fn().mockResolvedValue(undefined);
    const waitForSettle = jest.fn().mockResolvedValue(
      SettleReadingStub({
        settled: false,
        reason: 'ceiling',
        waitedMs: 5000,
        unsettled: ['network'],
        pendingRequests: 1,
      }),
    );
    return {
      session: BrowserSessionStub({ waitForMatch, waitForSettle }),
      getWaitForMatchCalls: (): readonly unknown[] => waitForMatch.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },

  // Playwright's strict locator rejects with a plain Error whose message names the violation — the
  // shape `isPlaywrightStrictModeViolationErrorGuard` reads.
  sessionMatchingTwice: ({
    candidates,
  }: {
    candidates: readonly StepCandidate[];
  }): {
    session: BrowserSession;
    getDescribeMatchesCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const waitForMatch = jest
      .fn()
      .mockRejectedValue(
        new Error(
          'locator.waitFor: Error: strict mode violation: locator(\'[data-testid="MODAL"]\') resolved to 2 elements',
        ),
      );
    const describeMatches = jest.fn().mockResolvedValue(candidates);
    const waitForSettle = jest.fn().mockResolvedValue(SettleReadingStub());
    return {
      session: BrowserSessionStub({ waitForMatch, describeMatches, waitForSettle }),
      getDescribeMatchesCalls: (): readonly unknown[] => describeMatches.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },

  sessionHittingCeiling: (): {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const waitForMatch = jest.fn().mockRejectedValue(new Error('Timeout 30000ms exceeded'));
    const waitForSettle = jest.fn().mockResolvedValue(SettleReadingStub());
    return {
      session: BrowserSessionStub({ waitForMatch, waitForSettle }),
      getWaitForMatchCalls: (): readonly unknown[] => waitForMatch.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },
});
