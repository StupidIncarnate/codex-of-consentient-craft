/**
 * PURPOSE: Enforces one rule, quoted from `flowriderPromptStatics`: "A node the graph prints
 * `(terminal)` that still points onward is not a terminal unit." A unit is one signable thing in a
 * flow graph, and `quest-to-units` calls this guard once per node to decide which nodes qualify.
 *
 * Counting every `terminal`-typed node as a unit, whatever its edges, overcounts. On one measured
 * flow it turned 7 typed-terminal nodes into 7 units when only 3 had no outgoing edge. The other
 * four were three `reject-*-back` loops and `restored-draft-to-send`. That is four phantom units on
 * every sign-off track, a sign-off track being one reviewing role — codeweaver, flowrider or
 * siegemaster. `get-qa-checklist` prints the corrected count of 3, and this guard is what produces
 * it.
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
