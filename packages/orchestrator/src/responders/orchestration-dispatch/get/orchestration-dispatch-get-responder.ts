/**
 * PURPOSE: Returns the current cross-process dispatch state for the web UI's play/pause control.
 *
 * USAGE:
 * const state = await OrchestrationDispatchGetResponder();
 * // Returns DispatchState — { mode: 'node-playing' | 'paused', mcpHeartbeatAt?, updatedAt }
 */

import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';

export const OrchestrationDispatchGetResponder = async (): Promise<DispatchState> =>
  dispatchStateReadBroker();
