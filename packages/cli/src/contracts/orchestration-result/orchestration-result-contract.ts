/**
 * PURPOSE: Defines the result of slot manager orchestration
 *
 * USAGE:
 * orchestrationResultContract.parse({type: 'all_complete'});
 * orchestrationResultContract.parse({type: 'needs_user_input', stepId: '...', question: '...'});
 * // Returns validated OrchestrationResult object
 */

import { z } from 'zod';

export const orchestrationResultContract = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('all_complete'),
  }),
  z.object({
    type: z.literal('all_blocked'),
  }),
  z.object({
    type: z.literal('needs_user_input'),
    stepId: z.string().uuid().brand<'StepId'>(),
    question: z.string().brand<'UserQuestion'>(),
  }),
  z.object({
    type: z.literal('needs_role_followup'),
    stepId: z.string().uuid().brand<'StepId'>(),
    targetRole: z.string().brand<'AgentRole'>(),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string().brand<'ErrorMessage'>(),
  }),
]);

export type OrchestrationResult = z.infer<typeof orchestrationResultContract>;
