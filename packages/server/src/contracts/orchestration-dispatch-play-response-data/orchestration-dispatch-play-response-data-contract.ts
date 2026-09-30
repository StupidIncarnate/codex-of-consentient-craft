/**
 * PURPOSE: Defines the `data` OrchestrationDispatchPlayResponder returns on success
 *
 * USAGE:
 * const data = orchestrationDispatchPlayResponseDataContract.parse(value);
 * // Returns validated OrchestrationDispatchPlayResponseData
 */

import { z } from '#gateway/npm/zod';
import { dispatchStateContract } from '@dungeonmaster/shared/contracts';

export const orchestrationDispatchPlayResponseDataContract = z.strictObject({ state: dispatchStateContract }).brand<'OrchestrationDispatchPlayResponseData'>();

export type OrchestrationDispatchPlayResponseData = z.infer<typeof orchestrationDispatchPlayResponseDataContract>;
