/**
 * PURPOSE: One atomic verification unit as enumerated straight off a flow graph — its derived id,
 * the graph element it anchors to, and that element's verbatim source text
 *
 * USAGE:
 * qaVerificationUnitContract.parse({
 *   kind: 'terminal',
 *   id: 'login-flow:terminal:dashboard',
 *   flowId: 'login-flow',
 *   nodeId: 'dashboard',
 *   nodeLabel: 'Dashboard',
 * });
 * // Returns: QaVerificationUnit — the `terminal` variant
 *
 * This is the SHARED enumeration `qaChecklistBuildTransformer` and `signoffOutstandingTransformer`
 * both consume, which is what makes "the ids a track's outstanding count names are the ids
 * get-qa-checklist printed" a structural fact rather than a convention two files have to keep.
 * The unit carries no `label` and no `checkSurface`: composing those (the branch grammar, the
 * spec-hole sentence for a blank observable, the per-kind and per-outcome-type check surfaces) is
 * the checklist renderer's job, and the outstanding count never needs them.
 *
 * A DISCRIMINATED UNION on `kind`, not one object with ten optionals. Each consumer narrows once
 * and then reads required fields — a flat optional shape would force `?? ` fallbacks on every
 * anchor the caller already knows is present, and those fallbacks are unreachable branches that
 * cannot be tested honestly.
 *
 * `addedBy` and `verifyByReading` live on the `observable` variant alone because provenance and
 * verification method are axes observables have and nodes/edges/off-map families do not.
 */

import { z } from 'zod';

import {
  flowEdgeContract,
  flowEdgeIdContract,
  flowIdContract,
  flowNodeContract,
  flowNodeIdContract,
  flowObservableContract,
  observableIdContract,
  observableOriginContract,
  qaChecklistItemIdContract,
  qaOffMapFamilyContract,
} from '@dungeonmaster/shared/contracts';

export const qaVerificationUnitContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('terminal'),
    id: qaChecklistItemIdContract,
    flowId: flowIdContract,
    nodeId: flowNodeIdContract,
    nodeLabel: flowNodeContract.shape.label,
  }),
  z.object({
    kind: z.literal('branch'),
    id: qaChecklistItemIdContract,
    flowId: flowIdContract,
    edgeId: flowEdgeIdContract,
    edgeFrom: flowEdgeContract.shape.from,
    // REQUIRED here although `flowEdgeContract.label` is optional: a branch unit exists only for an
    // edge that carries a non-empty label, so an absent one is an enumeration bug, not a shape.
    edgeLabel: z.string().min(1).brand<'FlowEdgeLabel'>(),
    edgeTo: flowEdgeContract.shape.to,
  }),
  z.object({
    kind: z.literal('observable'),
    id: qaChecklistItemIdContract,
    flowId: flowIdContract,
    nodeId: flowNodeIdContract,
    observableId: observableIdContract,
    observableType: flowObservableContract.shape.type,
    // Carried verbatim and allowed to be blank — a blank description is a spec hole the renderer
    // reports, never a reason to drop the unit and quietly shrink the definition of done.
    observableDescription: flowObservableContract.shape.description,
    verifyByReading: flowObservableContract.shape.verifyByReading,
    addedBy: observableOriginContract,
  }),
  z.object({
    kind: z.literal('off-map'),
    id: qaChecklistItemIdContract,
    flowId: flowIdContract,
    offMapFamily: qaOffMapFamilyContract,
  }),
]);

export type QaVerificationUnit = z.infer<typeof qaVerificationUnitContract>;
