/**
 * PURPOSE: Stops a single active chat process by its process ID
 *
 * USAGE:
 * const success = ChatStopResponder({ chatProcessId });
 * // Returns true if process was found and killed, false otherwise
 */

import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const ChatStopResponder = ({ chatProcessId }: { chatProcessId: ProcessId }): boolean =>
  orchestrationProcessesState.kill({ processId: chatProcessId });
