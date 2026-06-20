/**
 * PURPOSE: One tool_use call extracted from a sub-agent transcript — its fully-qualified name plus the workItemId argument (present only on a work-item agent's get-agent-prompt call, null otherwise)
 *
 * USAGE:
 * const invocation = transcriptToolInvocationContract.parse({ name: 'mcp__dungeonmaster__get-agent-prompt', workItemId: 'work-1' });
 * // Returns a TranscriptToolInvocation; workItemId is null when the tool call carried no workItemId argument
 */
import { z } from 'zod';

export const transcriptToolInvocationContract = z.object({
  name: z.string().min(1).brand<'TranscriptToolName'>(),
  workItemId: z.string().min(1).brand<'TranscriptWorkItemId'>().nullable(),
});

export type TranscriptToolInvocation = z.infer<typeof transcriptToolInvocationContract>;
