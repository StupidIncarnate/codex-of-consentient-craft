/**
 * PURPOSE: Defines the data shape for a React Flow node in the flow graph visualizer
 *
 * USAGE:
 * reactFlowNodeDataContract.parse({ nodeId: 'login-page', label: 'Login Page', nodeType: 'state', packages: [{ name: 'auth-service', packageType: 'library' }], contractCount: 2, commentCount: 0 });
 * // Returns: ReactFlowNodeData with branded fields
 */

import { z } from '#gateway/npm/zod';

import { flowNodeTypeContract, questContract, flowNodeContract, flowContract } from '@dungeonmaster/shared/contracts';

import { reactFlowPackageChipContract } from '../react-flow-package-chip/react-flow-package-chip-contract';

export const reactFlowNodeDataContract = z.object({
  nodeId: flowNodeContract.shape.id,
  label: z.string().min(1).brand<'ReactFlowNodeDataLabel'>(),
  nodeType: flowNodeTypeContract,
  // Where this node's work lands, painted on the card itself rather than behind a click: this is
  // what the reviewer signs off at the review_flows gate, and a node carrying more than one entry is
  // a seam — the card has to SHOW both sides for that to be reviewable at a glance. Mirrors the
  // persisted flowNodeContract's `.min(1)`, so a card can never render with no tag; each entry
  // carries the kind resolved against the quest's packagesAffected, because nothing may colour off
  // a package name.
  packages: z.array(reactFlowPackageChipContract).min(1),
  contractCount: z.number().int().min(0).brand<'ReactFlowNodeDataContractCount'>(),
  // How many comments this card already carries. Gated INDEPENDENTLY of questId/flowId below:
  // COMMENT_COUNT_BADGE reports the existing comment record and renders in every quest status,
  // including approved, complete and the read-only execution panel, while questId/flowId gate only
  // the compose affordance — sharing one visibility flag would hide the badge exactly when the
  // review it captures becomes most worth reading.
  commentCount: z.number().int().min(0).brand<'ReactFlowNodeDataCommentCount'>(),
  // Anchor context for the comment affordance on this card. Both are present only when the
  // comment compose controls are allowed for this quest (status precedes approved AND the quest
  // has a resumable chat session); their absence is what makes the card render no comment button.
  questId: questContract.shape.id.optional(),
  flowId: flowContract.shape.id.optional(),
}).brand<'ReactFlowNodeData'>();

export type ReactFlowNodeData = z.infer<typeof reactFlowNodeDataContract>;
