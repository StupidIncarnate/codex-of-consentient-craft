/**
 * PURPOSE: Zod schema for UserPromptSubmit hook event data
 *
 * USAGE:
 * const hookData = userPromptSubmitHookDataContract.parse(data);
 * // Returns validated UserPromptSubmitHookData with user_prompt
 */
import { z } from '#gateway/npm/zod';
import { sessionContract } from '@dungeonmaster/shared/contracts';

export const userPromptSubmitHookDataContract = z.object({
  session_id: sessionContract.shape.id,
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('UserPromptSubmit'),
  user_prompt: z.string().brand<'UserPrompt'>(),
}).brand<'UserPromptSubmitHookData'>();

export type UserPromptSubmitHookData = z.infer<typeof userPromptSubmitHookDataContract>;
