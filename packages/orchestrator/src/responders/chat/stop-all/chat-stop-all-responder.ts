/**
 * PURPOSE: Stops all active processes and clears the process registry
 *
 * USAGE:
 * ChatStopAllResponder();
 * // Kills all tracked processes and clears state
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const ChatStopAllResponder = (): AdapterResult => {
  orchestrationProcessesState.killAll();
  return adapterResultContract.parse({ success: true });
};
