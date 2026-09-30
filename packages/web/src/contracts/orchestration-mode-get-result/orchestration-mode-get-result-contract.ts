/**
 * PURPOSE: Validates the wire body of GET /api/orchestration/mode. `fetchJson` resolves `unknown`; this is what the broker
 * parses its response through before unwrapping the `mode` field.
 *
 * USAGE:
 * orchestrationModeGetResultContract.parse(body);
 * // Returns the body with `mode` validated
 */

import { orchestrationModeContract } from '@dungeonmaster/shared/contracts';
import { z } from '#gateway/npm/zod';

export const orchestrationModeGetResultContract = z.object({
  mode: orchestrationModeContract,
}).brand<'OrchestrationModeGetResult'>();

export type OrchestrationModeGetResult = z.infer<typeof orchestrationModeGetResultContract>;
