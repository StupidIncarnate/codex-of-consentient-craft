/**
 * PURPOSE: Defines a file reference within a quest step, identifying the file path
 *
 * USAGE:
 * stepFileReferenceContract.parse({path: 'src/brokers/user/create/user-create-broker.ts'});
 * // Returns: StepFileReference object with branded path
 */

import { z } from 'zod';

export const stepFileReferenceContract = z.object({
  path: z.string().min(1).brand<'FilePath'>(),
});

export type StepFileReference = z.infer<typeof stepFileReferenceContract>;
