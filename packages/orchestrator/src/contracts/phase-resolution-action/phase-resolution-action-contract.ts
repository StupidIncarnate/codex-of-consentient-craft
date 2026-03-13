/**
 * PURPOSE: Defines valid action values returned by the quest phase resolver
 *
 * USAGE:
 * phaseResolutionActionContract.parse('launch-pathseeker');
 * // Returns: 'launch-pathseeker' as PhaseResolutionAction
 */

import { z } from 'zod';

export const phaseResolutionActionContract = z.enum([
  'launch-chat',
  'resume-chat',
  'launch-pathseeker',
  'resume-pathseeker',
  'launch-codeweaver',
  'resume-codeweaver',
  'launch-ward',
  'launch-siegemaster',
  'launch-lawbringer',
  'halt',
  'complete',
  'blocked',
  'wait-for-user',
]);

export type PhaseResolutionAction = z.infer<typeof phaseResolutionActionContract>;
