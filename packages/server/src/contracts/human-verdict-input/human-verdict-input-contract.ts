/**
 * PURPOSE: Defines the validated shape for the human-verdict endpoint's merged path param
 * (`questId`) and JSON body (`unitId`, `outcome`, `reason`) — the record of a person's judgment on
 * one `verifyByHuman` observable
 *
 * USAGE:
 * const input = humanVerdictInputContract.parse({ questId, unitId, outcome: 'met', reason: 'Watched it end to end.' });
 * // Returns: HumanVerdictInput ready for orchestratorRecordHumanVerdictAdapter
 */

import { z } from 'zod';
import { questIdContract } from '@dungeonmaster/shared/contracts';

export const humanVerdictInputContract = z
  .object({
    questId: questIdContract.describe('The quest the verdict is recorded against'),
    unitId: z
      .string()
      .min(1)
      .brand<'HumanVerdictUnitId'>()
      .describe('The verifyByHuman observable id the person judged'),
    outcome: z.enum(['met', 'not-met']).describe("The person's outcome on the named criterion"),
    reason: z
      .string()
      .min(1)
      .brand<'HumanVerdictReason'>()
      .describe('Why — becomes the note detail'),
  })
  .strict();

export type HumanVerdictInput = z.infer<typeof humanVerdictInputContract>;
