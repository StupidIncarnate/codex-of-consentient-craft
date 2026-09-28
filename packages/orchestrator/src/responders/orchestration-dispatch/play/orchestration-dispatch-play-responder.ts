/**
 * PURPOSE: Starts the Node dispatcher — persists mode 'node-playing' and flips the in-memory
 * mirror, which kicks the runner via the bootstrap's wake subscription. The mirror of
 * OrchestrationDispatchPauseResponder, and like it never refuses: the Node dispatcher is the only
 * dispatcher, so nothing else can hold a claim on the queue.
 *
 * USAGE:
 * const state = await OrchestrationDispatchPlayResponder();
 * // Returns the persisted DispatchState with mode 'node-playing'
 */

import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateWriteBroker } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker';
import { orchestrationDispatchState } from '../../../state/orchestration-dispatch/orchestration-dispatch-state';

export const OrchestrationDispatchPlayResponder = async (): Promise<DispatchState> => {
  const current = await dispatchStateReadBroker();

  const state = await dispatchStateWriteBroker({
    // Play sets the user's intent and nothing more, so the spread keeps `hold`. A live hold still
    // refuses every dispatch, and pressing play against a spent quota arms the queue for the moment
    // the window resets rather than sending a child straight into the wall.
    dispatchState: { ...current, mode: 'node-playing' },
  });
  orchestrationDispatchState.setPlaying({ isPlaying: true });
  orchestrationDispatchState.setHold({ hold: state.hold ?? null });

  return state;
};
