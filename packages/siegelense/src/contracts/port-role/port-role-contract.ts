/**
 * PURPOSE: Which half of an instance's claimed `PortPair` a lane process binds — `'api'` or
 * `'web'` — or `null` for a process that binds neither (a worker with no HTTP surface of its own).
 * `laneSpecContract`'s refine reads this to reject two processes claiming the same role, because
 * two processes racing for one port is a boot that fails nondeterministically rather than loudly.
 *
 * USAGE:
 * portRoleContract.parse('api');
 * // Returns: 'api' as PortRole
 */

import { z } from 'zod';

export const portRoleContract = z.enum(['api', 'web']).brand<'PortRole'>();

export type PortRole = z.infer<typeof portRoleContract>;
