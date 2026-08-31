/**
 * PURPOSE: Defines one atomic QA verification unit enumerated from a flow graph — a terminal, a
 * labelled decision branch, an embedded observable, or an off-map probe family — carrying the
 * verbatim text to confirm and the surface to confirm it at
 *
 * USAGE:
 * qaChecklistItemContract.parse({
 *   id: 'view-persisted-comments:observable:check-badge-count-text',
 *   flowId: 'view-persisted-comments', kind: 'observable', nodeId: 'render-comment-badge',
 *   observableId: 'check-badge-count-text', observableType: 'ui-state',
 *   label: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
 *   checkSurface: 'the rendered DOM in a real, attached, VISIBLE browser tab',
 * });
 * // Returns: QaChecklistItem
 *
 * `label` is VERBATIM source text, never a paraphrase — a paraphrased observable is how a walk ends
 * up confirming something adjacent to the promise. Items are produced only by
 * `qaChecklistBuildTransformer`, never authored, so the optional anchor fields are populated per
 * `kind` rather than freely: observable → nodeId + observableId + observableType, terminal →
 * nodeId, branch → edgeId, off-map → offMapFamily.
 *
 * DELIBERATELY ABSENT: whether a terminal is a success or an error/skip. The graph does not encode
 * it and guessing from label wording would put a judgement call inside a tool whose whole value is
 * being deterministic. The walker classifies it; the tool only guarantees the list is complete.
 */

import { z } from 'zod';

import { flowEdgeIdContract } from '../flow-edge-id/flow-edge-id-contract';
import { flowIdContract } from '../flow-id/flow-id-contract';
import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { outcomeTypeContract } from '../outcome-type/outcome-type-contract';
import { qaChecklistItemIdContract } from '../qa-checklist-item-id/qa-checklist-item-id-contract';
import { qaChecklistKindContract } from '../qa-checklist-kind/qa-checklist-kind-contract';
import { qaOffMapFamilyContract } from '../qa-off-map-family/qa-off-map-family-contract';

export const qaChecklistItemContract = z.object({
  id: qaChecklistItemIdContract,
  flowId: flowIdContract,
  kind: qaChecklistKindContract,
  label: z
    .string()
    .min(1)
    .brand<'QaChecklistLabel'>()
    .describe(
      'The verbatim text of the thing to confirm — an observable description exactly as the spec words it, a terminal node label, a branch description, or an off-map probe. Never a paraphrase.',
    ),
  checkSurface: z
    .string()
    .min(1)
    .brand<'QaCheckSurface'>()
    .describe(
      'Where the value must actually be read from. For an observable this is derived from its outcome type, because the surface a flow is DRIVEN at and the surface an observable is CHECKED at are routinely different.',
    ),
  nodeId: flowNodeIdContract.optional(),
  observableId: observableIdContract.optional(),
  observableType: outcomeTypeContract.optional(),
  verifyByReading: z
    .boolean()
    .optional()
    .describe(
      'True on an observable settled by opening a source file rather than by running a test. `checkSurface` already carries the read-the-file wording; this field is what a renderer marks the line with, so the distinction survives a scan of the list.',
    ),
  edgeId: flowEdgeIdContract.optional(),
  offMapFamily: qaOffMapFamilyContract.optional(),
});

export type QaChecklistItem = z.infer<typeof qaChecklistItemContract>;
