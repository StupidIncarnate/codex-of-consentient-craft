/**
 * PURPOSE: Validates the POST /api/orchestration/dispatch/play request body — an optional
 * `force` flag that overrides the dispatcher-exclusivity gate.
 *
 * USAGE:
 * dispatchPlayBodyContract.parse({ force: true });
 * // Returns: DispatchPlayBody
 */

import { z } from 'zod';

export const dispatchPlayBodyContract = z.object({
  force: z.boolean().optional(),
});

export type DispatchPlayBody = z.infer<typeof dispatchPlayBodyContract>;
