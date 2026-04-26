/**
 * PURPOSE: Defines the validated body shape for the tooling smoketest run responder
 *
 * USAGE:
 * const { suite } = toolingSmoketestRunBodyContract.parse(body);
 * // Returns: { suite: SmoketestSuite }
 */

import { z } from 'zod';
import { smoketestSuiteContract } from '@dungeonmaster/shared/contracts';

export const toolingSmoketestRunBodyContract = z.object({
  suite: smoketestSuiteContract,
});

export type ToolingSmoketestRunBody = z.infer<typeof toolingSmoketestRunBodyContract>;
