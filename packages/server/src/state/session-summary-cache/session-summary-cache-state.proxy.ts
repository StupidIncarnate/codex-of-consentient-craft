/**
 * PURPOSE: Test proxy for session-summary-cache-state that ensures clean cache state between tests
 *
 * USAGE:
 * const proxy = sessionSummaryCacheStateProxy(); // call at start of each test
 * proxy.setupEmpty();
 */

import { sessionSummaryCacheState } from './session-summary-cache-state';

export const sessionSummaryCacheStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    sessionSummaryCacheState.clear();
  },
});
