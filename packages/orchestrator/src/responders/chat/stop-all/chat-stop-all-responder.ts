/**
 * PURPOSE: Stops all active chat processes and clears the process registry
 *
 * USAGE:
 * ChatStopAllResponder();
 * // Kills all tracked chat processes and clears state
 */

import { chatProcessState } from '../../../state/chat-process/chat-process-state';

export const ChatStopAllResponder = (): void => {
  chatProcessState.killAll();
};
