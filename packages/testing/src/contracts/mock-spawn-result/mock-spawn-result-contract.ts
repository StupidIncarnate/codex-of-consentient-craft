/**
 * PURPOSE: Validates mock spawn result data for child process testing
 *
 * USAGE:
 * mockSpawnResultContract.parse({code: 0, stdout: 'success', stderr: ''});
 * // Returns validated MockSpawnResult with branded types
 */

import { z } from '#gateway/npm/zod';

export const mockSpawnResultContract = z
  .object({
    code: z.number().int().brand<'MockSpawnResultCode'>(),
    stdout: z.string().brand<'MockSpawnResultStdout'>(),
    stderr: z.string().brand<'MockSpawnResultStderr'>(),
  })
  .brand<'MockSpawnResult'>();

export type MockSpawnResult = z.infer<typeof mockSpawnResultContract>;
