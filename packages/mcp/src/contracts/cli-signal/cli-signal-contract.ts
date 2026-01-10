/**
 * PURPOSE: Defines the structure of a CLI signal file for inter-process communication
 *
 * USAGE:
 * const signal = cliSignalContract.parse({ action: 'return', screen: 'list', timestamp: '2024-01-01T00:00:00.000Z' });
 * // Returns a validated CliSignal object
 */
import { z } from 'zod';

export const cliSignalContract = z.object({
  action: z.literal('return').brand<'CliSignalAction'>(),
  screen: z.enum(['menu', 'list']).brand<'CliSignalScreen'>(),
  timestamp: z.string().datetime().brand<'Timestamp'>(),
});

export type CliSignal = z.infer<typeof cliSignalContract>;
export type CliSignalAction = CliSignal['action'];
export type CliSignalScreen = CliSignal['screen'];
