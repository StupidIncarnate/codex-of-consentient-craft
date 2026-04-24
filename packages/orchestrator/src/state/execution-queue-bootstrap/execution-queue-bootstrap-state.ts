/**
 * PURPOSE: Tracks whether the first-WS-connect recovery sweep has run once for the lifetime of this orchestrator process — gates the bootstrap responder's presence handler from re-sweeping on every presence flip
 *
 * USAGE:
 * executionQueueBootstrapState.getHasRecoveredOnce();
 * executionQueueBootstrapState.markRecovered();
 * executionQueueBootstrapState.clear();
 */

const state: { hasRecoveredOnce: boolean } = {
  hasRecoveredOnce: false,
};

export const executionQueueBootstrapState = {
  getHasRecoveredOnce: (): boolean => state.hasRecoveredOnce,

  markRecovered: (): void => {
    state.hasRecoveredOnce = true;
  },

  clear: (): void => {
    state.hasRecoveredOnce = false;
  },
};
