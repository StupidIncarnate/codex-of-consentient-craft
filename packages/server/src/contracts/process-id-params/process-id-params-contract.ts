/**
 * PURPOSE: Defines the validated shape for HTTP route params containing a processId field
 *
 * USAGE:
 * const { processId } = processIdParamsContract.parse(params);
 * // Returns: ProcessIdParams with branded ProcessId
 */

import { z } from 'zod';
import { processIdContract } from '../process-id/process-id-contract';

export const processIdParamsContract = z.object({
  processId: processIdContract,
});

export type ProcessIdParams = z.infer<typeof processIdParamsContract>;
