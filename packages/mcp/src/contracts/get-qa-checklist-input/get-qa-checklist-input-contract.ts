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
 * getQaChecklistInputContract.parse({questId: 'add-auth', track: 'flowrider'});
 * // Returns: GetQaChecklistInput scoped to the flows and sign-off field that track is judged on
 *
 * `track` is the SHARED `signoffTrackContract` rather than a local enum, so the value a session
 * passes here is the same value the signal-back completion gate keys on. The schema is `.strict()`,
 * so an unadvertised key is a hard parse rejection rather than a silently ignored argument.
 */

import { signoffTrackContract } from '@dungeonmaster/shared/contracts';
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
    track: signoffTrackContract
      .describe(
        "Your verification track. Pass it and REMAINING counts the units awaiting YOUR sign-off field (flowriderSignoff / siegemasterSignoff) — the same number the signal-back completion gate will compute. 'flowrider' also narrows the flow set to the quest's runtime flows, which is the only set Flowrider is measured over. Omit it to list every flow with no track applied.",
      )
      .optional(),
  })
  .strict()
  .brand<'GetQaChecklistInput'>();

export type GetQaChecklistInput = z.infer<typeof getQaChecklistInputContract>;
