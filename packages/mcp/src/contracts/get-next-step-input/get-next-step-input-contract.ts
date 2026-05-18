/**
 * PURPOSE: Defines the (empty) input schema for the MCP get-next-step tool /dumpster-launch polls in its dispatch loop
 *
 * USAGE:
 * getNextStepInputContract.parse({});
 * // Returns: validated GetNextStepInput (no fields — server picks the FIFO-oldest active quest)
 */
import { z } from 'zod';

export const getNextStepInputContract = z.object({}).strict();

export type GetNextStepInput = z.infer<typeof getNextStepInputContract>;
