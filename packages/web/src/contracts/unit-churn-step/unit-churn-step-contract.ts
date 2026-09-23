/**
 * PURPOSE: One row of a unit's churn — the mark ONE work item in a scope recorded for it, and that
 * work item's own display label. Reach for this only as a member of `unitChurnContract.marks`; on its
 * own it says nothing about WHICH unit or where it sits in the sequence.
 *
 * USAGE:
 * unitChurnStepContract.parse({ mark: 'unmet', workItemLabel: 'work' });
 * // Returns: UnitChurnStep
 */

import { z } from 'zod';

import { unitMarkContract } from '@dungeonmaster/shared/contracts';

import { displayLabelContract } from '../display-label/display-label-contract';

export const unitChurnStepContract = z.object({
  mark: unitMarkContract,
  workItemLabel: displayLabelContract,
});

export type UnitChurnStep = z.infer<typeof unitChurnStepContract>;
