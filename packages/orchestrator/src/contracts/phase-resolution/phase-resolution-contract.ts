/**
 * PURPOSE: Defines the return type for the quest phase resolver — what action to take next for a quest
 *
 * USAGE:
 * phaseResolutionContract.parse({action: 'launch-pathseeker'});
 * // Returns: PhaseResolution object describing the next orchestration action
 */

import { z } from 'zod';

import { sessionIdContract, stepIdContract } from '@dungeonmaster/shared/contracts';

import { chatRoleContract } from '../chat-role/chat-role-contract';
import { phaseResolutionActionContract } from '../phase-resolution-action/phase-resolution-action-contract';

export const phaseResolutionContract = z.object({
  action: phaseResolutionActionContract,
  role: chatRoleContract.optional(),
  resumeSessionId: sessionIdContract.optional(),
  resetStepIds: z.array(stepIdContract).optional(),
  context: z.string().brand<'PhaseResolutionContext'>().optional(),
});

export type PhaseResolution = z.infer<typeof phaseResolutionContract>;
