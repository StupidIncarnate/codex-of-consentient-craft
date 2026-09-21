/**
 * PURPOSE: The payload a codeweaver piece carries — the file group it writes, the standing context a
 * sub-agent needs, and the units its unit tests must settle. Reach for this over the flowrider and
 * siegemaster payloads by the piece's FAMILY: the envelope's `family` field is the only discriminator,
 * which is why `workPlanContract`'s own refinement picks between the three rather than
 * `z.discriminatedUnion`.
 *
 * USAGE:
 * workPlanPayloadCodeweaverContract.parse({
 *   files: [{ path: './packages/web/src/x-widget.tsx', change: 'new', in: '{}', out: 'ReactElement' }],
 *   units: [],
 * });
 * // Returns: WorkPlanPayloadCodeweaver — every key defaults to [], so a sparse payload parses
 *
 * `units` MAY be empty, and that is not a degenerate case: a contracts-only piece proves nothing
 * itself, because a contract is proved by the code that reads it. Its flowrider sibling declares
 * `.min(1)` for the opposite reason — see that file.
 *
 * `units` is an ARRAY keyed by `unitId`, never a map keyed by observable TYPE. Terminals and labelled
 * edges carry no type tag at all, so a type-keyed map would lose two whole kinds silently.
 */

import { z } from 'zod';

import { workPlanCodeweaverUnitContract } from '../work-plan-codeweaver-unit/work-plan-codeweaver-unit-contract';
import { workPlanFileEntryContract } from '../work-plan-file-entry/work-plan-file-entry-contract';

export const workPlanPayloadCodeweaverContract = z.object({
  files: z.array(workPlanFileEntryContract).default([]),
  facts: z
    .array(z.string().min(1).brand<'PieceFact'>())
    .default([])
    .describe('What is already true in this tree that a sub-agent would otherwise re-derive.'),
  fences: z
    .array(z.string().min(1).brand<'PieceFence'>())
    .default([])
    .describe('The rules this piece must stay inside.'),
  traps: z
    .array(z.string().min(1).brand<'PieceTrap'>())
    .default([])
    .describe('The mistakes this piece is known to invite, stated before they are made.'),
  doNotTouch: z
    .array(z.string().min(1).brand<'PieceDoNotTouch'>())
    .default([])
    .describe('What belongs to another piece or another mechanism entirely.'),
  units: z.array(workPlanCodeweaverUnitContract).default([]),
});

export type WorkPlanPayloadCodeweaver = z.infer<typeof workPlanPayloadCodeweaverContract>;
