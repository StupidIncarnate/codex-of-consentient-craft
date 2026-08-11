/**
 * PURPOSE: Validates input for the get-qa-checklist MCP tool
 *
 * USAGE:
 * getQaChecklistInputContract.parse({questId: 'add-auth'});
 * // Returns: GetQaChecklistInput for every flow on the quest
 *
 * getQaChecklistInputContract.parse({questId: 'add-auth', flowId: 'login-flow'});
 * // Returns: GetQaChecklistInput scoped to one flow
 *
 * getQaChecklistInputContract.parse({questId: 'add-auth', track: 'groundstomper'});
 * // Returns: GetQaChecklistInput scoped to the flows and units that DENOMINATOR is measured over
 *
 * `track` is the SHARED `signoffDenominatorTrackContract` — the three denominators, not the two
 * sign-off fields — so the value a session passes here is the value the signal-back completion gate
 * keys on. Taking the field enum instead is what left a Groundstomper session with no way to name
 * itself: it writes `flowriderSignoff`, so a field-keyed input would have handed it Flowrider's
 * package kinds, which are the exact complement of its own.
 *
 * `packageNames` is advertised for the same reason. Flowrider's tail fans out to one item per
 * package plus a seam item, and the gate narrows each one by the names its operation item declares —
 * so a session holding a sliced item and unable to pass them here reads a whole-quest remainder
 * while its own gate clears at zero. The schema is `.strict()`, so an unadvertised key is a hard
 * parse rejection rather than a silently ignored argument, which is what makes advertising it the
 * whole fix.
 */

import {
  packageNameContract,
  signoffDenominatorTrackContract,
} from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const getQaChecklistInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to enumerate the QA surface for')
      .brand<'QuestId'>(),
    flowId: z
      .string()
      .min(1)
      .describe(
        'Optional flow id. Omit to enumerate every flow on the quest; pass one to scope the checklist to the flow this session owns.',
      )
      .brand<'FlowId'>()
      .optional(),
    track: signoffDenominatorTrackContract
      .describe(
        "Your verification track — the ROLE you were dispatched as, not the sign-off field you write. Pass it and REMAINING counts the units in YOUR denominator still carrying no sign-off, which is exactly what the signal-back completion gate will refuse `done` on. 'flowrider' and 'groundstomper' both write flowriderSignoff but are measured over DISJOINT package kinds (groundstomper: the browser-reachable ones), so passing the other role's name returns the complement of your own work. Both also narrow the flow set to the quest's runtime flows, the only set they are measured over. Omit it to list every flow with no track applied.",
      )
      .optional(),
    packageNames: z
      .array(packageNameContract)
      .describe(
        'The package names your operation item declares, if it declares any. Pass them and REMAINING is narrowed to your slice the same way the completion gate narrows it — a per-package flowrider item owns the units whose node tags exactly its one package, and the seam item owns the glue. Omit them when your item declares none, and nothing is narrowed.',
      )
      .optional(),
  })
  .strict()
  .brand<'GetQaChecklistInput'>();

export type GetQaChecklistInput = z.infer<typeof getQaChecklistInputContract>;
