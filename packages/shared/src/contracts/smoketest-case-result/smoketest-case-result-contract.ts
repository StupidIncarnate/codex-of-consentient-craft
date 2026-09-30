/**
 * PURPOSE: Defines the per-case pass/fail result returned from a smoketest run
 *
 * USAGE:
 * smoketestCaseResultContract.parse({ caseId: 'mcp-list-quests', name: 'list-quests', passed: true });
 * // Returns: SmoketestCaseResult
 */

import { z } from '#gateway/npm/zod';

import { chatEntryContract } from '../chat-entry/chat-entry-contract';

export const smoketestCaseResultContract = z.object({
  caseId: z.string().min(1).brand<'SmoketestCaseResultCaseId'>(),
  name: z.string().min(1).brand<'SmoketestCaseResultName'>(),
  passed: z.boolean(),
  summary: z.string().brand<'SmoketestCaseResultSummary'>().optional(),
  errorMessage: z.string().brand<'SmoketestCaseResultErrorMessage'>().optional(),
  output: z.string().brand<'SmoketestCaseResultOutput'>().optional(),
  durationMs: z.number().int().nonnegative().brand<'SmoketestCaseResultDurationMs'>().optional(),
  prompt: z.string().brand<'SmoketestCaseResultPrompt'>().optional(),
  model: z.string().brand<'SmoketestCaseResultModel'>().optional(),
  entries: z.array(chatEntryContract).optional(),
}).brand<'SmoketestCaseResult'>();

export type SmoketestCaseResult = z.infer<typeof smoketestCaseResultContract>;
