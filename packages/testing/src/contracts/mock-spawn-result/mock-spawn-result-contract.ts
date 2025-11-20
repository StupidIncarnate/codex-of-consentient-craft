/**
 * PURPOSE: Validates mock spawn result data for child process testing
 *
 * USAGE:
 * mockSpawnResultContract.parse({code: 0, stdout: 'success', stderr: ''});
 * // Returns validated MockSpawnResult with branded types
 */

import { z } from 'zod';

export const mockSpawnResultContract = z.object({
  code: z.number().int().brand<'ExitCode'>(),
  stdout: z.string().brand<'StdoutOutput'>(),
  stderr: z.string().brand<'StderrOutput'>(),
});

export type MockSpawnResult = z.infer<typeof mockSpawnResultContract>;
