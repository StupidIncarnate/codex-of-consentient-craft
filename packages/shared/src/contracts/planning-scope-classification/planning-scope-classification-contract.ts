/**
 * PURPOSE: Defines the PlanningScopeClassification structure for PathSeeker's scope-classification phase
 *
 * USAGE:
 * planningScopeClassificationContract.parse({size: 'medium', slicing: '...', slices: [...], rationale: '...', classifiedAt: '2024-...'});
 * // Returns: PlanningScopeClassification object — PathSeeker's Phase 1+2 output
 */

import { z } from 'zod';

import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { sliceNameContract } from '../slice-name/slice-name-contract';

const sliceContract = z.object({
  name: sliceNameContract.describe(
    'Slice name — unique within the quest. Step IDs in this slice must be prefixed with the slice name followed by a dash.',
  ),
  packages: z
    .array(packageNameContract)
    .describe('Packages this slice owns. Used to bound the surface-scope minion dispatch.'),
  flowIds: z
    .array(flowNodeIdContract)
    .describe(
      'Flow node ids this slice satisfies. Multiple slices may share the same flow node when they collaborate on a single observable.',
    ),
});

export type Slice = z.infer<typeof sliceContract>;

export const planningScopeClassificationContract = z.object({
  size: z.enum(['small', 'medium', 'large']),
  slicing: z.string().min(1).brand<'SlicingDescription'>(),
  slices: z
    .array(sliceContract)
    .default([])
    .describe(
      'Formal slice registry. Each slice has a unique name, owned packages, and the flow nodes it satisfies. Pathseeker writes this during seek_scope; surface-scope minions tag every step they emit with their assigned slice name.',
    ),
  rationale: z.string().min(1).brand<'ScopeRationale'>(),
  classifiedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type PlanningScopeClassification = z.infer<typeof planningScopeClassificationContract>;
