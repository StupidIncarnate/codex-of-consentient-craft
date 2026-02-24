/**
 * PURPOSE: Adapter for StartOrchestrator.stopChat that wraps the orchestrator package
 *
 * USAGE:
 * const stopped = orchestratorStopChatAdapter({ chatProcessId });
 * // Returns: boolean indicating if process was found and killed
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

export const orchestratorStopChatAdapter = ({
  chatProcessId,
}: {
  chatProcessId: ProcessId;
}): boolean => StartOrchestrator.stopChat({ chatProcessId });
