/**
 * PURPOSE: Validates mock process behavior configuration for child process testing
 *
 * USAGE:
 * mockProcessBehaviorContract.parse({result: {code: 0, stdout: 'success', stderr: ''}});
 * // Returns validated MockProcessBehavior with branded types
 */

import { z } from 'zod';
import { mockSpawnResultContract } from '../mock-spawn-result/mock-spawn-result-contract';

export const mockProcessBehaviorContract = z.object({
  shouldThrow: z.boolean().optional(),
  throwError: z.instanceof(Error).optional(),
  result: mockSpawnResultContract.optional(),
  delay: z.number().int().nonnegative().brand<'DelayMilliseconds'>().optional(),
});

export type MockProcessBehavior = z.infer<typeof mockProcessBehaviorContract>;
