/**
 * PURPOSE: Defines a file reference within a quest step, identifying the file path and action (create or modify)
 *
 * USAGE:
 * stepFileReferenceContract.parse({path: 'src/brokers/user/create/user-create-broker.ts', action: 'create'});
 * // Returns: StepFileReference object with branded path
 */

import { z } from 'zod';

export const stepFileReferenceContract = z.object({
  path: z.string().min(1).brand<'FilePath'>(),
  action: z.enum(['create', 'modify']),
});

export type StepFileReference = z.infer<typeof stepFileReferenceContract>;
