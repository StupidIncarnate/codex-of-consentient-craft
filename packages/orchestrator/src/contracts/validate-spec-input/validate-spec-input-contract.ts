/**
 * PURPOSE: Defines the input schema for the validate-spec tool that runs structural checks on a quest spec before step generation
 *
 * USAGE:
 * const input: ValidateSpecInput = validateSpecInputContract.parse({ questId: 'add-auth' });
 * // Returns validated ValidateSpecInput with questId
 */
import { z } from 'zod';

export const validateSpecInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest whose spec will be validated')
      .brand<'QuestId'>(),
  })
  .brand<'ValidateSpecInput'>();

export type ValidateSpecInput = z.infer<typeof validateSpecInputContract>;
