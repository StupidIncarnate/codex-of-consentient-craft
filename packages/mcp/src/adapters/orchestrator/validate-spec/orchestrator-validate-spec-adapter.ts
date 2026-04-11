/**
 * PURPOSE: Adapter for StartOrchestrator.validateSpec that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorValidateSpecAdapter({ questId });
 * // Returns: VerifyQuestResult (shared with verify-quest — same { success, checks, error? } shape)
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { VerifyQuestResult } from '@dungeonmaster/orchestrator';

export const orchestratorValidateSpecAdapter = async ({
  questId,
}: {
  questId: string;
}): Promise<VerifyQuestResult> => StartOrchestrator.validateSpec({ questId });
