/**
 * PURPOSE: Defines the `data` OrchestrationDispatchGetResponder returns on success
 *
 * USAGE:
 * const data = orchestrationDispatchGetResponseDataContract.parse(value);
 * // Returns validated OrchestrationDispatchGetResponseData
 */

import { z } from '#gateway/npm/zod';
import { dispatchStateContract } from '@dungeonmaster/shared/contracts';

export const orchestrationDispatchGetResponseDataContract = z.strictObject({ state: dispatchStateContract }).brand<'OrchestrationDispatchGetResponseData'>();

export type OrchestrationDispatchGetResponseData = z.infer<typeof orchestrationDispatchGetResponseDataContract>;
