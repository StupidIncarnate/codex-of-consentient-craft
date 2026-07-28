/**
 * PURPOSE: Defines the quest payload an MCP agent receives from get-quest — identical to
 * GetQuestResult except the comments array is omitted from the quest shape entirely
 *
 * USAGE:
 * agentQuestPayloadContract.parse({ success: true, quest: {...} });
 * // Returns validated AgentQuestPayload; quest carries no `comments` key at all, not even an
 * // empty array, because the target shape has no such key for zod to populate
 */
import { z } from 'zod';

import { questContract } from '@dungeonmaster/shared/contracts';

// quest.comments is a record for the USER, delivered to an agent exactly once as the markdown
// chat turn the comment-batch route sends. Omitting the key (not emptying it to []) is what makes
// that guarantee legible: `comments: []` still tells the agent "there were comments, now cleared"
// and costs a re-read; no key at all costs nothing and invites no re-action of feedback the agent
// already handled several turns ago. `.omit` drops `comments` from the schema's shape, so zod's
// default "strip unknown keys" parse behavior removes it from whatever the orchestrator hands
// back — see quest-strip-comments-transformer.ts for where this contract is actually applied.
export const agentQuestPayloadContract = z.object({
  success: z.boolean(),
  quest: questContract.omit({ comments: true }).optional(),
  error: z.string().brand<'ErrorMessage'>().optional(),
});

export type AgentQuestPayload = z.infer<typeof agentQuestPayloadContract>;
