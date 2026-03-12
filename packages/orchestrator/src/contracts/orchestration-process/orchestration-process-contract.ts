/**
 * PURPOSE: Defines the structure for tracking a running orchestration process
 *
 * USAGE:
 * orchestrationProcessContract.parse({processId, questId, kill: () => {}});
 * // Returns: OrchestrationProcess object for tracking active process with kill capability
 */

import { z } from 'zod';

import { processIdContract, questIdContract } from '@dungeonmaster/shared/contracts';

export const orchestrationProcessContract = z.object({
  processId: processIdContract,
  questId: questIdContract,
  kill: z.function().args().returns(z.void()),
});

export type OrchestrationProcess = z.infer<typeof orchestrationProcessContract>;
