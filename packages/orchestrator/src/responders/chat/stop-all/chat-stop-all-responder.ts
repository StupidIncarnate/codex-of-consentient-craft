/**
 * PURPOSE: Stops all active processes and clears the process registry
 *
 * USAGE:
 * ChatStopAllResponder();
 * // Kills all tracked processes and clears state
 */

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const ChatStopAllResponder = (): void => {
  orchestrationProcessesState.killAll();
};
