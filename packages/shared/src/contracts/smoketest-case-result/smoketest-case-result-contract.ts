/**
 * PURPOSE: Defines the per-case pass/fail result returned from a smoketest run
 *
 * USAGE:
 * smoketestCaseResultContract.parse({ caseId: 'mcp-list-quests', name: 'list-quests', passed: true });
 * // Returns: SmoketestCaseResult
 */

import { z } from 'zod';

import { chatEntryContract } from '../chat-entry/chat-entry-contract';

export const smoketestCaseResultContract = z.object({
  caseId: z.string().min(1).brand<'SmoketestCaseId'>(),
  name: z.string().min(1).brand<'SmoketestCaseName'>(),
  passed: z.boolean(),
  summary: z.string().brand<'SmoketestCaseSummary'>().optional(),
  errorMessage: z.string().brand<'ErrorMessage'>().optional(),
  output: z.string().brand<'AgentOutput'>().optional(),
  durationMs: z.number().int().nonnegative().brand<'DurationMs'>().optional(),
  prompt: z.string().brand<'AgentPromptText'>().optional(),
  model: z.string().brand<'AgentModelLabel'>().optional(),
  entries: z.array(chatEntryContract).optional(),
});

export type SmoketestCaseResult = z.infer<typeof smoketestCaseResultContract>;
