/**
 * PURPOSE: The terminal status of one `run` call — `done`, `timeout` or `failed` — the top-level
 * verdict `runResultContract` carries. Reach for this over InstanceState: InstanceState answers
 * whether the browser-holding PROCESS is still around (`alive`, `killed`, `dead`, `pruned`,
 * `unknown`); RunStatus answers how the last batch of STEPS against that process concluded, and an
 * instance stays `alive` through any number of `failed` or `timeout` runs.
 *
 * USAGE:
 * runStatusContract.parse('timeout');
 * // Returns a branded RunStatus
 */

import { z } from 'zod';

export const runStatusContract = z.enum(['done', 'timeout', 'failed']).brand<'RunStatus'>();

export type RunStatus = z.infer<typeof runStatusContract>;
