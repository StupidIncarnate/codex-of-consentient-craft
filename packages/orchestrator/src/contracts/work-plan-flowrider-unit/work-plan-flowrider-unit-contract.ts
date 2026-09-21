/**
 * PURPOSE: One unit a flowrider piece must settle, as the planner forecast it — which unit, at which
 * layer, against which graph element, with the assertion that settles it and the value that turns
 * that assertion red. Reach for this over `workPlanCodeweaverUnitContract` when the piece's
 * deliverable is a SPEC FILE: the layer and the graph target are the decisions a spec author makes
 * and a unit-test author never does.
 *
 * USAGE:
 * workPlanFlowriderUnitContract.parse({
 *   unitId: 'send-flow:terminal:batch-sent',
 *   kind: 'terminal',
 *   layer: 'browser',
 *   observableTarget: { target: 'node', nodeId: 'batch-sent' },
 *   assert: 'the queue panel renders zero rows once the send resolves',
 *   failsIf: 'the panel still renders the sent rows',
 * });
 * // Returns: WorkPlanFlowriderUnit
 *
 * `kind` is the WHOLE `qaChecklistKindContract`, off-map included, unlike the codeweaver unit's
 * three: a probe family is reachable from a spec that drives the built system even though no unit
 * test beside the code reaches one.
 *
 * `surface` is FILLED BY THE ORCHESTRATOR, never typed by a planner, and never persisted with a
 * value either — `get-quest-work` computes it fresh on every read from `qaCheckSurfaceStatics`. It is
 * `.optional()` so a planner's submission with no `surface` key parses; a submission that DOES carry
 * one also parses today, and whether that should be a refusal belongs to the plan VALIDATOR rather
 * than to this shape.
 */

import {
  flowEdgeIdContract,
  flowNodeIdContract,
  qaChecklistItemContract,
  qaChecklistKindContract,
  unitIdContract,
} from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const workPlanFlowriderUnitContract = z.object({
  unitId: unitIdContract,
  kind: qaChecklistKindContract,
  layer: z
    .enum(['browser', 'below-browser'])
    .describe('Where this unit is driven from — a real browser, or the layer under it.'),
  surface: qaChecklistItemContract.shape.checkSurface
    .optional()
    .describe('Filled by the orchestrator on read; a planner leaves it absent.'),
  observableTarget: z.object({
    target: z.enum(['observable', 'node', 'edge']),
    nodeId: flowNodeIdContract.optional(),
    edgeId: flowEdgeIdContract.optional(),
  }),
  assert: z
    .string()
    .min(1)
    .brand<'PieceUnitAssert'>()
    .describe('What the spec reads, and off which surface.'),
  failsIf: z
    .string()
    .min(1)
    .brand<'PieceUnitFailsIf'>()
    .describe('The wrong value that turns that assertion red.'),
});

export type WorkPlanFlowriderUnit = z.infer<typeof workPlanFlowriderUnitContract>;
