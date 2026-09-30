/**
 * PURPOSE: Defines the `data` OrchestrationModeGetResponder returns on success
 *
 * USAGE:
 * const data = orchestrationModeGetResponseDataContract.parse(value);
 * // Returns validated OrchestrationModeGetResponseData
 */

import { z } from '#gateway/npm/zod';

export const orchestrationModeGetResponseDataContract = z
  .strictObject({ mode: z.enum(['claude', 'node']) })
  .brand<'OrchestrationModeGetResponseData'>();

export type OrchestrationModeGetResponseData = z.infer<
  typeof orchestrationModeGetResponseDataContract
>;
