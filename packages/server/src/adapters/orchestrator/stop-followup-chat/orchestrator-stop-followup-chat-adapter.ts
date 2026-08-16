/**
 * PURPOSE: Adapter for StartOrchestrator.stopFollowupChat that wraps the orchestrator package
 *
 * USAGE:
 * const { stopped } = await orchestratorStopFollowupChatAdapter({ questId });
 * // Returns: { stopped: boolean } — false when nothing was running to stop
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorStopFollowupChatAdapter = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ stopped: boolean }> => StartOrchestrator.stopFollowupChat({ questId });
