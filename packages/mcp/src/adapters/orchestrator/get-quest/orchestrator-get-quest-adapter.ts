/**
 * PURPOSE: Adapter for StartOrchestrator.getQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorGetQuestAdapter({ questId });
 * // Returns: GetQuestResult or throws error
 *
 * const filtered = await orchestratorGetQuestAdapter({ questId, stage: 'spec' });
 * // Returns: GetQuestResult with only the spec-stage sections populated
 *
 * const sliced = await orchestratorGetQuestAdapter({ questId, flowId: 'login', packageName: 'web' });
 * // Returns: GetQuestResult carrying `flowSlice` — that one flow rendered whole for that package
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';

export const orchestratorGetQuestAdapter = async ({
  questId,
  stage,
  flowId,
  packageName,
}: {
  questId: string;
  stage?: string;
  flowId?: string;
  packageName?: string;
}): Promise<GetQuestResult> =>
  StartOrchestrator.getQuest({
    questId,
    ...(stage && { stage }),
    ...(flowId && { flowId }),
    ...(packageName && { packageName }),
  });
