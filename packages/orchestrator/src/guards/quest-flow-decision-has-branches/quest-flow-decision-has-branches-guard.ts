/**
 * PURPOSE: Validates that every decision node has at least two outgoing edges (decisions must branch)
 *
 * USAGE:
 * questFlowDecisionHasBranchesGuard({flows});
 * // Returns true if every decision node has >=2 outgoing edges, false if any has <2
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch structural bugs where a decision node doesn't actually branch.
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

const MIN_DECISION_OUTGOING = 2;

export const questFlowDecisionHasBranchesGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  return flows.every((flow) =>
    flow.nodes
      .filter((node) => node.type === 'decision')
      .every((node) => {
        const outgoing = flow.edges.filter((edge) => String(edge.from) === String(node.id));
        return outgoing.length >= MIN_DECISION_OUTGOING;
      }),
  );
};
