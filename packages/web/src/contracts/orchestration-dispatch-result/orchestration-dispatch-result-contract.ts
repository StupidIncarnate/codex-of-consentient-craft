/**
 * PURPOSE: Validates the wire body of POST /api/orchestration/dispatch/pause and /play: the
 * dispatcher's `state` after the switch. `fetchJson` resolves `unknown`; this is what both
 * dispatch brokers parse their response through.
 *
 * USAGE:
 * orchestrationDispatchResultContract.parse({ state: DispatchStateStub() });
 * // Returns { state: DispatchState }
 */

import { dispatchStateContract } from '@dungeonmaster/shared/contracts';
import { z } from '#gateway/npm/zod';

export const orchestrationDispatchResultContract = z
  .object({
    state: dispatchStateContract,
  })
  .brand<'OrchestrationDispatchResult'>();

export type OrchestrationDispatchResult = z.infer<typeof orchestrationDispatchResultContract>;
