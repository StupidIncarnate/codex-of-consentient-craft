/**
 * PURPOSE: The signed `'+N'` / `'-N'` form `compare` prints for one index delta between two runs
 * (`'+2'`, `'-3'`) — the regex requires an explicit sign so a zero delta renders `'+0'` and is never
 * mistaken for the unsigned `ReadingCount` it was computed from. Reach for this over `ReadingCount`
 * on any field that answers "how did this change", never "how many are there right now".
 *
 * USAGE:
 * countDeltaContract.parse('+2');
 * // Returns a branded CountDelta
 */

import { z } from 'zod';

export const countDeltaContract = z
  .string()
  .regex(/^[+-]\d+$/u)
  .brand<'CountDelta'>();

export type CountDelta = z.infer<typeof countDeltaContract>;
