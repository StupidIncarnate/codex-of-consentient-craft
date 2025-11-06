/**
 * PURPOSE: Zod schema for SessionStart hook event data
 *
 * USAGE:
 * const data = sessionStartHookDataContract.parse({ session_id: 'abc', transcript_path: '/path', cwd: '/cwd', hook_event_name: 'SessionStart' });
 * // Returns validated SessionStartHookData
 */
import { z } from 'zod';

export const sessionStartHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('SessionStart'),
});

export type SessionStartHookData = z.infer<typeof sessionStartHookDataContract>;
