/**
 * PURPOSE: Defines the MCP-tool input schema for the get-quest tool. Extends shared get-quest-input
 * with an optional response format selector.
 *
 * USAGE:
 * const input: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated GetQuestInput with questId and default format='text'
 *
 * IT REBUILDS THE OBJECT RATHER THAN WRAPPING IT. The shared contract ends in a `superRefine` that
 * rejects `stage` alongside `flowId` / `packageName`, and a `ZodEffects` cannot be `.extend()`ed —
 * so this reaches the object through `.innerType()` and re-applies the same rejection afterwards.
 * Both copies read their wording from `getQuestInputConflictsStatics`, which is what keeps the two
 * from drifting into different explanations of one refusal: an agent only ever reads ONE of them.
 */
import { getQuestInputContract as sharedGetQuestInputContract } from '@dungeonmaster/shared/contracts';
import { getQuestInputConflictsStatics } from '@dungeonmaster/shared/statics';
import { z } from 'zod';

export const getQuestInputContract = sharedGetQuestInputContract
  .unwrap()
  .innerType()
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
        code: z.ZodIssueCode.custom,
        path: ['flowId'],
        message: getQuestInputConflictsStatics.flowIdWithStage,
      });
    }
    if (value.stage !== undefined && value.packageName !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['packageName'],
        message: getQuestInputConflictsStatics.packageNameWithStage,
      });
    }
  })
  .brand<'McpGetQuestInput'>();

export type GetQuestInput = z.infer<typeof getQuestInputContract>;
