/**
 * PURPOSE: Zod schema for UserPromptSubmit hook event data
 *
 * USAGE:
 * const hookData = userPromptSubmitHookDataContract.parse(data);
 * // Returns validated UserPromptSubmitHookData with user_prompt
 */
import { z } from 'zod';

export const userPromptSubmitHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('UserPromptSubmit'),
  user_prompt: z.string().brand<'UserPrompt'>(),
});

export type UserPromptSubmitHookData = z.infer<typeof userPromptSubmitHookDataContract>;
