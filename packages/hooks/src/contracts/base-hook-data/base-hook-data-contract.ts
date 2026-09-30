/**
 * PURPOSE: Zod schema defining base fields shared by all hook data types
 *
 * USAGE:
 * const baseData = baseHookDataContract.parse(data);
 * // Returns validated BaseHookData with session_id, transcript_path, cwd, hook_event_name
 */
import { z } from '#gateway/npm/zod';
import { sessionContract } from '@dungeonmaster/shared/contracts';

export const baseHookDataContract = z.object({
  session_id: sessionContract.shape.id,
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.string().min(1).brand<'HookEventName'>(),
});

export type BaseHookData = z.infer<typeof baseHookDataContract>;
