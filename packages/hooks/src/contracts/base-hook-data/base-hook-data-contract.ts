import { z } from 'zod';

export const baseHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.string().min(1).brand<'HookEventName'>(),
});

export type BaseHookData = z.infer<typeof baseHookDataContract>;
