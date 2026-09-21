/**
 * PURPOSE: The payload a flowrider piece carries — the one spec file it writes, the harnesses that
 * file needs, the walk it drives, and the units that walk must settle. Reach for this over the
 * codeweaver payload when the piece's deliverable is a SPEC FILE rather than a file group, and over
 * the siegemaster payload when the walk is automated rather than hand-driven.
 *
 * USAGE:
 * workPlanPayloadFlowriderContract.parse({
 *   specPath: './packages/web/src/flows/send/send-batch.e2e.ts',
 *   mode: 'new',
 *   walk: { shape: 'journey', paths: [] },
 *   units: [{ unitId: 'send-flow:terminal:batch-sent', kind: 'terminal', layer: 'browser',
 *             observableTarget: { target: 'node', nodeId: 'batch-sent' },
 *             assert: '…', failsIf: '…' }],
 * });
 * // Returns: WorkPlanPayloadFlowrider
 *
 * `units` may NOT be empty. Unlike codeweaver, a flowrider piece's whole job is proving units, so
 * `.min(1)` catches the degenerate case at parse time rather than leaving it to the cross-reference
 * check that runs against the quest later.
 *
 * `walk.paths[]` reuses `qaWalkPathContract` verbatim — that shape already carries `branchLabels`
 * (NOT `forceLabels`) and `exitsFlow`, and a walk crossing into another flow needs the latter set,
 * so re-declaring a two-field `{ nodeIds, branchLabels }` here would silently drop it.
 *
 * `harnesses` omits `proves`: a harness settles no unit of its own — it is the machinery the spec
 * file drives through, and the spec file is what carries the `proves` list.
 */

import { filePathContract, qaWalkPathContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { workPlanFileEntryContract } from '../work-plan-file-entry/work-plan-file-entry-contract';
import { workPlanFlowriderUnitContract } from '../work-plan-flowrider-unit/work-plan-flowrider-unit-contract';

export const workPlanPayloadFlowriderContract = z.object({
  specPath: filePathContract,
  mode: z
    .enum(['new', 'extend'])
    .describe('Whether this piece writes a fresh spec file or extends one that already exists.'),
  harnesses: z.array(workPlanFileEntryContract.omit({ proves: true })).default([]),
  walk: z.object({
    shape: z
      .enum(['journey', 'matrix'])
      .describe(
        'How the paths compose — one route driven end to end, or a grid of inputs against one route.',
      ),
    paths: z.array(qaWalkPathContract).default([]),
    pathsTruncated: z
      .boolean()
      .default(false)
      .describe('True when the enumeration was cut short, so a reader knows the list is partial.'),
  }),
  units: z.array(workPlanFlowriderUnitContract).min(1),
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
});

export type WorkPlanPayloadFlowrider = z.infer<typeof workPlanPayloadFlowriderContract>;
