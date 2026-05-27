/**
 * PURPOSE: Result returned by questRunWardBroker — what the run-ward MCP tool forwards to the orchestrator LLM
 *
 * USAGE:
 * const result: QuestRunWardResult = questRunWardResultContract.parse({...});
 * // Returned synchronously by quest-run-ward-broker once ward exits and the result is persisted.
 */

import { z } from 'zod';

import {
  fileNameContract,
  exitCodeContract,
  questIdContract,
  questWorkItemIdContract,
  wardResultContract,
} from '@dungeonmaster/shared/contracts';

export const questRunWardResultContract = z.object({
  success: z.literal(true),
  questId: questIdContract,
  workItemId: questWorkItemIdContract,
  exitCode: exitCodeContract,
  wardResultId: wardResultContract.shape.id,
  lastWardRunId: fileNameContract.optional(),
});

export type QuestRunWardResult = z.infer<typeof questRunWardResultContract>;
