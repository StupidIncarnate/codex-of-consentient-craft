/**
 * PURPOSE: Zod schema for the PreToolUse payload the folder-detail hook reads — deliberately
 * separate from preToolUseHookDataContract and permissive via .loose() so a change to that
 * shared union, or an unfamiliar payload shape, can never break this hook's fail-open path
 *
 * USAGE:
 * const result = folderDetailHookDataContract.safeParse(JSON.parse(input));
 * // On success: result.data.tool_input.file_path is present; unknown keys survive via passthrough
 */
import { z } from '#gateway/npm/zod';

export const folderDetailHookDataContract = z
  .object({
    hook_event_name: z.literal('PreToolUse'),
    tool_name: z.string().min(1).brand<'ToolName'>(),
    tool_input: z.object({ file_path: z.string().min(1).brand<'FilePath'>() }).loose(),
    transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
    agent_id: z.string().min(1).brand<'AgentId'>().optional(),
  })
  .loose();

export type FolderDetailHookData = z.infer<typeof folderDetailHookDataContract>;
