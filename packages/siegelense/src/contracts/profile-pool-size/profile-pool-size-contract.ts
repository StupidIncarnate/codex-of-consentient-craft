/**
 * PURPOSE: How many siegelense instances were running on this machine when a memory reading was
 * taken. Positive, never zero — the instance whose beat produced the reading is itself one of them,
 * so a pool of nothing cannot have measured anything. Reach for this over `ReadingCount`: a
 * ReadingCount is a tally of events inside one run, while this is the CONDITION a run was measured
 * under, and it is the field siegelense-tooling.md line 1488 says a profile schema without it cannot
 * satisfy — averaging a solo reading with a contended one produces a number true of neither.
 *
 * USAGE:
 * profilePoolSizeContract.parse(3);
 * // Returns a branded ProfilePoolSize
 */

import { z } from 'zod';

export const profilePoolSizeContract = z.number().int().positive().brand<'ProfilePoolSize'>();

export type ProfilePoolSize = z.infer<typeof profilePoolSizeContract>;
