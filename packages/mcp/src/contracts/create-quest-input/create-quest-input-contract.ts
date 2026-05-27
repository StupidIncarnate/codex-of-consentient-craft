/**
 * PURPOSE: Defines the input schema for the MCP create-quest tool ChaosWhisperer calls at /dumpster-create startup
 *
 * USAGE:
 * createQuestInputContract.parse({ userRequest: 'Build the login flow' });
 * // Returns: validated CreateQuestInput with the user's original request text
 */
import { z } from 'zod';

export const createQuestInputContract = z
  .object({
    userRequest: z
      .string()
      .min(1)
      .describe('The original user request that initiated this quest')
      .brand<'UserRequest'>(),
  })
  .strict();

export type CreateQuestInput = z.infer<typeof createQuestInputContract>;
