/**
 * PURPOSE: `flowriderPromptStatics` states the rule this guard exists to enforce: "A node the graph
 * prints `(terminal)` that still points onward is not a terminal unit." A hand-written predecessor
 * counted every `terminal`-typed node as a verification unit regardless of its edges, and on one
 * measured flow that overcounted 7 typed-terminal nodes into 7 units when only 3 actually had no
 * outgoing edge — the other four were three `reject-*-back` loops plus `restored-draft-to-send` —
 * four phantom units on every track. `get-qa-checklist` prints the corrected count (3), which is
 * what this guard produces when `quest-to-units` calls it per node.
 *
 * USAGE:
 * isTerminalUnitGuard({ nodeId: FlowNodeIdStub({ value: 'done' }), nodeType: 'terminal', edgeSourceIds: [] });
 * // Returns true — a terminal node with nothing leaving it
 */
import type { FlowNodeId, FlowNodeType } from '@dungeonmaster/shared/contracts';

export const isTerminalUnitGuard = ({
  nodeId,
  nodeType,
  edgeSourceIds,
}: {
  nodeId?: FlowNodeId;
  nodeType?: FlowNodeType;
  edgeSourceIds?: readonly FlowNodeId[];
}): boolean => {
  if (nodeId === undefined || nodeType === undefined || edgeSourceIds === undefined) {
    return false;
  }

  if (nodeType !== 'terminal') {
    return false;
  }

  const edgeSourceIdSet = new Set(edgeSourceIds);
  return !edgeSourceIdSet.has(nodeId);
};
