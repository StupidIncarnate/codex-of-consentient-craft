/**
 * PURPOSE: Defines the MCP-tool input schema for the get-quest tool. Extends shared getQuestInputContract
 * with an optional response format selector; reach for shared's own contract when no `format` is wanted.
 *
 * USAGE:
 * const input: McpGetQuestInput = mcpGetQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated McpGetQuestInput with questId and default format='text'
 *
 * IT EXTENDS THE SHARED SCHEMA DIRECTLY. Zod v4's `.superRefine()`/`.brand()` attach in place, so `.extend()`
 * adds `format` AND carries the shared refinement forward. The `.superRefine()` below re-applies the
 * identical rejection; both copies read their wording from `getQuestInputConflictsStatics`.
 */
import { getQuestInputContract as sharedGetQuestInputContract } from '@dungeonmaster/shared/contracts';
import { getQuestInputConflictsStatics } from '@dungeonmaster/shared/statics';
import { z } from '#gateway/npm/zod';

export const mcpGetQuestInputContract = sharedGetQuestInputContract
  .extend({
    format: z
      .enum(['json', 'text'])
      .describe(
        'Output format. "text" returns a human-readable text display with flow graphs (default). "json" returns the quest as JSON. IGNORED when flowId or packageName is passed — a flow slice is a rendered text product and is always returned as text.',
      )
      .default('text'),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.stage !== undefined && value.flowId !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['flowId'],
        message: getQuestInputConflictsStatics.flowIdWithStage,
      });
    }
    if (value.stage !== undefined && value.packageName !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['packageName'],
        message: getQuestInputConflictsStatics.packageNameWithStage,
      });
    }
  })
  .brand<'McpGetQuestInput'>();

export type McpGetQuestInput = z.infer<typeof mcpGetQuestInputContract>;
