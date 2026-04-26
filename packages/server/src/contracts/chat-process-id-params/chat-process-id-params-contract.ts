/**
 * PURPOSE: Defines the validated shape for HTTP route params containing a chatProcessId field
 *
 * USAGE:
 * const { chatProcessId } = chatProcessIdParamsContract.parse(params);
 * // Returns: ChatProcessIdParams with branded ProcessId
 */

import { z } from 'zod';
import { processIdContract } from '../process-id/process-id-contract';

export const chatProcessIdParamsContract = z.object({
  chatProcessId: processIdContract,
});

export type ChatProcessIdParams = z.infer<typeof chatProcessIdParamsContract>;
