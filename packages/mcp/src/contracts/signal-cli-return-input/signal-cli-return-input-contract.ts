/**
 * PURPOSE: Defines the input schema for the MCP signal-cli-return tool
 *
 * USAGE:
 * const input = signalCliReturnInputContract.parse({ screen: 'list' });
 * // Returns validated input for the signal-cli-return tool
 */
import { z } from 'zod';

export const signalCliReturnInputContract = z.object({
  screen: z
    .enum(['menu', 'list'])
    .default('list')
    .describe('Screen to show after return')
    .brand<'CliSignalScreen'>(),
});

export type SignalCliReturnInput = z.infer<typeof signalCliReturnInputContract>;
