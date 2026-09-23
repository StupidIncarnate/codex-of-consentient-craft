/**
 * PURPOSE: One unit's whole churn — the sequence of marks two or more of a scope's work items
 * recorded for it, in the order those work items ran. `marks.min(unitChurnStatics.limits.minMarksForChurn)`
 * is the definition of churn itself: a unit only one work item ever touched is that item's own mark,
 * already visible on its own row, not a sequence worth reading.
 *
 * USAGE:
 * unitChurnContract.parse({
 *   unitId: 'send-flow:observable:scan-finds-every-path',
 *   marks: [{ mark: 'unmet', workItemLabel: 'work' }, { mark: 'met', workItemLabel: 'work' }],
 * });
 * // Returns: UnitChurn
 */

import { z } from 'zod';

import { unitIdContract } from '@dungeonmaster/shared/contracts';

import { unitChurnStepContract } from '../unit-churn-step/unit-churn-step-contract';
import { unitChurnStatics } from '../../statics/unit-churn/unit-churn-statics';

export const unitChurnContract = z.object({
  unitId: unitIdContract,
  marks: z.array(unitChurnStepContract).min(unitChurnStatics.limits.minMarksForChurn),
});

export type UnitChurn = z.infer<typeof unitChurnContract>;
