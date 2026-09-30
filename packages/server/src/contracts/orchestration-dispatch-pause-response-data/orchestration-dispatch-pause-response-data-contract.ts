/**
 * PURPOSE: Defines the `data` OrchestrationDispatchPauseResponder returns on success
 *
 * USAGE:
 * const data = orchestrationDispatchPauseResponseDataContract.parse(value);
 * // Returns validated OrchestrationDispatchPauseResponseData
 */

import { z } from '#gateway/npm/zod';
import { dispatchStateContract } from '@dungeonmaster/shared/contracts';

export const orchestrationDispatchPauseResponseDataContract = z
  .strictObject({ state: dispatchStateContract })
  .brand<'OrchestrationDispatchPauseResponseData'>();

export type OrchestrationDispatchPauseResponseData = z.infer<
  typeof orchestrationDispatchPauseResponseDataContract
>;
