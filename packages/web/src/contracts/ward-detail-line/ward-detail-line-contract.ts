/**
 * PURPOSE: Branded string for a single human-readable ward-detail breakdown line (one lint/typecheck
 * error or one test failure) rendered under a failed [WARD] execution row.
 *
 * USAGE:
 * const line = wardDetailLineContract.parse('lint: src/index.ts:10 — Unexpected any');
 * // Returns: WardDetailLine branded string
 */

import { z } from 'zod';

export const wardDetailLineContract = z.string().brand<'WardDetailLine'>();

export type WardDetailLine = z.infer<typeof wardDetailLineContract>;
