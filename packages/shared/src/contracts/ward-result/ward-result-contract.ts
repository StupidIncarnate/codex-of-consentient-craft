/**
 * PURPOSE: Stores ward (npm run ward) failure output at quest level
 *
 * USAGE:
 * wardResultContract.parse({id: 'f47ac10b-...', createdAt: '2024-01-15T10:00:00.000Z', exitCode: 1, filePaths: []});
 * // Returns: WardResult object
 */

import { z } from 'zod';

export const wardResultContract = z.object({
  id: z.string().uuid().brand<'WardResultId'>(),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  exitCode: z.number().int().brand<'ExitCode'>(),
  filePaths: z.array(z.string().brand<'FilePath'>()),
  errorSummary: z.string().brand<'ErrorMessage'>().optional(),
  runId: z.string().brand<'WardRunId'>().optional(),
});

export type WardResult = z.infer<typeof wardResultContract>;
