/**
 * PURPOSE: One unit a work item was ASSIGNED, paired with its current mark — `met`, `cant-meet` or
 * `unmet` once `workItem.observations` names it, `unmarked` while it still does not. `unmarked` is a
 * fourth, display-only state on top of `unitMarkContract`'s three: no observation ever carries it, an
 * in-progress work item's `observations` array is simply a strict subset of `assignedUnitIds` until it
 * signals.
 *
 * USAGE:
 * unitMarkReadoutContract.parse({ unitId: 'send-flow:observable:check-badge-count-text', mark: 'unmarked' });
 * // Returns: UnitMarkReadout
 */

import { z } from 'zod';

import { unitIdContract } from '@dungeonmaster/shared/contracts';

export const unitMarkReadoutContract = z.object({
  unitId: unitIdContract,
  mark: z.enum(['met', 'cant-meet', 'unmet', 'unmarked']),
});

export type UnitMarkReadout = z.infer<typeof unitMarkReadoutContract>;
