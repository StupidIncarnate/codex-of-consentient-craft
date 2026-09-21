/**
 * PURPOSE: One file on a plan piece's map — where it lives, whether it is new or an edit, the shape
 * that goes in, the shape that comes out, and (on a test file only) which units it proves. Reach for
 * this on any piece that names FILES; the per-unit rows a session must mark are
 * `workPlanCodeweaverUnitContract` / `workPlanFlowriderUnitContract` instead, and the two are
 * cross-checked rather than merged.
 *
 * USAGE:
 * workPlanFileEntryContract.parse({
 *   path: './packages/web/src/widgets/comment-badge/comment-badge-widget.tsx',
 *   change: 'new',
 *   in: '{ count: number }',
 *   out: 'ReactElement',
 * });
 * // Returns: WorkPlanFileEntry
 *
 * `in` and `out` are FREE-FORM type sketches, not parsed TypeScript: a planner writes what a file
 * takes and gives back in whatever notation reads fastest, and a sub-agent builds against it. Making
 * them parseable would put a type checker inside a forecast.
 *
 * `proves` is `.optional()` rather than defaulted so an absent key on a PRODUCT file stays absent —
 * a product file proves nothing by itself, and an empty array there would read as a test file that
 * proves nothing, which is a different claim.
 */

import { filePathContract, unitIdContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const workPlanFileEntryContract = z.object({
  path: filePathContract,
  change: z.enum(['new', 'edit']),
  in: z
    .string()
    .min(1)
    .brand<'PieceTypeSketch'>()
    .describe(
      'What this file takes, as a free-form sketch — e.g. `{ path: string; ordinal: number }`.',
    ),
  out: z
    .string()
    .min(1)
    .brand<'PieceTypeSketch'>()
    .describe('What this file gives back, as a free-form sketch.'),
  proves: z
    .array(unitIdContract)
    .optional()
    .describe('Present on a TEST file only — the units this file is written to settle.'),
});

export type WorkPlanFileEntry = z.infer<typeof workPlanFileEntryContract>;
