/**
 * PURPOSE: Defines the MCP-tool input schema for the get-quest tool. Extends shared get-quest-input
 * with an optional response format selector.
 *
 * USAGE:
 * const input: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated GetQuestInput with questId and default format='text'
 *
 * IT EXTENDS THE SHARED SCHEMA DIRECTLY. Zod v4's `.superRefine()`/`.brand()` attach in place
 * rather than wrapping the schema in a separate class, so `.extend()` here both adds `format` AND
 * carries the shared schema's own `stage`/`flowId`/`packageName` refinement forward unchanged. This
 * file's own `.superRefine()` below re-applies the identical rejection anyway — a harmless,
 * redundant second check now rather than the load-bearing re-application it used to be — so the
 * two copies still read their wording from ONE place, `getQuestInputConflictsStatics`, and an agent
 * only ever reads ONE of them regardless of which check actually fired.
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

export type GetQuestInput = z.infer<typeof mcpGetQuestInputContract>;
