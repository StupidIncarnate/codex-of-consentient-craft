/**
 * PURPOSE: Validates input for the validate-spec MCP tool
 *
 * USAGE:
 * validateSpecInputContract.parse({questId: 'add-auth'});
 * // Returns: ValidateSpecInput branded object
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
