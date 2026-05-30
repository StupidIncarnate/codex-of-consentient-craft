/**
 * PURPOSE: Defines the input schema for the MCP create-quest tool ChaosWhisperer calls at /dumpster-create startup
 *
 * USAGE:
 * createQuestInputContract.parse({ userRequest: 'Build the login flow' });
 * // Returns: validated CreateQuestInput with the user's original request text
 */
import { z } from 'zod';
import { questTypeContract } from '@dungeonmaster/shared/contracts';

export const createQuestInputContract = z
  .object({
    userRequest: z
      .string()
      .min(1)
      .describe('The original user request that initiated this quest')
      .brand<'UserRequest'>(),
    questType: questTypeContract
      .optional()
      .describe(
        "Which pipeline this quest follows. Omit for the default feature pipeline; set to 'bug-hunt' (the /dumpster-hunt intake) to seed the PestEater regression pipeline.",
      ),
  })
  .strict();

export type CreateQuestInput = z.infer<typeof createQuestInputContract>;
