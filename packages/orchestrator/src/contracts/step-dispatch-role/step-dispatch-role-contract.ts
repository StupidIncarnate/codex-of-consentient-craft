/**
 * PURPOSE: Defines the data `stepDispatchRoleTransformer` returns
 *
 * USAGE:
 * stepDispatchRoleContract.parse(value);
 * // Returns validated StepDispatchRole
 */
import { z } from '#gateway/npm/zod';
import { claudeModelContract } from '../claude-model/claude-model-contract';

export const stepDispatchRoleContract = z
  .object({
    prompt: z.string().brand<'StepDispatchRolePrompt'>().nullable(),
    model: claudeModelContract.optional(),
  })
  .brand<'StepDispatchRole'>();

export type StepDispatchRole = z.infer<typeof stepDispatchRoleContract>;
