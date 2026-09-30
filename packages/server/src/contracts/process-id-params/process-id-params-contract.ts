/**
 * PURPOSE: Defines the validated shape for HTTP route params containing a processId field
 *
 * USAGE:
 * const { processId } = processIdParamsContract.parse(params);
 * // Returns: ProcessIdParams with branded ProcessId
 */

import { z } from '#gateway/npm/zod';

export const processIdParamsContract = z.object({
  processId: z.string().min(1).brand<'ProcessIdParamsProcessId'>(),
});

export type ProcessIdParams = z.infer<typeof processIdParamsContract>;
