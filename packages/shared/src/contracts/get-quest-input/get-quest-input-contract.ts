/**
 * PURPOSE: Defines the input schema for the quest get operation. Two selectors that answer
 * different questions share it: `stage` picks which SECTIONS of the whole quest come back, while
 * `flowId` / `packageName` pick ONE flow (and optionally one package's half of it) and hand back a
 * rendered slice instead. Reach for the slice arguments whenever a session owns a single flow —
 * a whole real quest renders past `mcpToolResultStatics.maxVerbatimChars`, and an over-budget tool
 * result is spilled to a file and answered with an error stub rather than delivered.
 *
 * USAGE:
 * const input: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated GetQuestInput with questId
 *
 * const filtered: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth', stage: 'spec' });
 * // Returns only the sections mapped to the 'spec' stage; excluded sections come back as empty arrays
 *
 * const sliced: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth', flowId: 'login', packageName: 'web' });
 * // Returns the login flow whole, with web's nodes marked and every other package's observables collapsed
 */
import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { questStageContract } from '../quest-stage/quest-stage-contract';
import { getQuestInputConflictsStatics } from '../../statics/get-quest-input-conflicts/get-quest-input-conflicts-statics';

export const getQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to retrieve').brand<'QuestId'>(),
    flowId: flowIdContract
      .describe(
        'ONE flow, rendered whole: every node with the packages it lands in, every edge with its branch label, every observable, the contracts and design decisions that govern it, the cross-flow edges in BOTH directions, and the sign-offs already recorded. This is the call a codeweaver, flowrider or siegemaster makes for the flow it owns — one call per flow, never the whole quest.',
      )
      .optional(),
    packageName: packageNameContract
      .describe(
        "Narrows the slice to ONE package. With flowId it MARKS that package's nodes in the whole flow and collapses every other package's observables to a count — the graph is never filtered, because cutting a package's nodes out of it destroys the edges between them. Without flowId it is the foundation view: every contract this package owns, and which flows it tags nodes in. Codeweaver passes it; flowrider and siegemaster own a whole flow and do not.",
      )
      .optional(),
    stage: questStageContract
      .describe(
        [
          'Optional pipeline stage to filter sections. Omit to return all sections. Excluded array sections return as empty arrays; excluded planningNotes returns as its default empty shape, and the text renderer omits their headers entirely.',
          'Stage values:',
          '- "spec": flows, designDecisions, contracts, toolingRequirements, operations, workItems',
          '- "planning": planningNotes, operations, contracts',
          '- "implementation": flows, designDecisions, contracts, toolingRequirements, operations, workItems, planningNotes',
          'NEVER pass it alongside flowId or packageName — those return a rendered flow slice, and a stage cannot select sections of one.',
        ].join(' '),
      )
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    // Hard rejections rather than a precedence rule. `stage` and the slice arguments are answers to
    // different questions, and letting one silently win is how a caller reads an empty section and
    // concludes the quest has nothing there — the one failure shape a size-driven slice exists to
    // prevent, arriving by a different route.
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
  .brand<'GetQuestInput'>();

export type GetQuestInput = z.infer<typeof getQuestInputContract>;
