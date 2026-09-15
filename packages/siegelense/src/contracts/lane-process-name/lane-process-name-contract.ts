/**
 * PURPOSE: The name of one process inside a lane spec — `'api'`, `'web'` — distinct from
 * `portRole`: a spec may one day carry a process with no port at all (a background worker), so the
 * name is what a log path and a boot-failure report address the process BY, and `portRole` is only
 * whether it claims one of the two reserved ports. Reach for this over `specNameContract` when
 * naming a PROCESS inside a spec rather than the spec itself.
 *
 * USAGE:
 * laneProcessNameContract.parse('api');
 * // Returns: 'api' as LaneProcessName
 */

import { z } from 'zod';

export const laneProcessNameContract = z.string().min(1).brand<'LaneProcessName'>();

export type LaneProcessName = z.infer<typeof laneProcessNameContract>;
