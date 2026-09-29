/**
 * PURPOSE: The observable the quest-flow seed injects into a terminal node that has none. Reach
 * for this over a stub: production code reads literals, never a `.stub`.
 *
 * USAGE:
 * flowObservableContract.parse({ ...questFlowObservableSeedStatics.observable });
 * // Returns a FlowObservable with id 'harness-terminal-observable'
 */

export const questFlowObservableSeedStatics = {
  observable: {
    id: 'harness-terminal-observable',
    type: 'ui-state',
    description: 'harness-seeded observable',
    package: 'auth-service',
  },
} as const;
