/**
 * PURPOSE: Returns descriptions of decision nodes with fewer than 2 outgoing edges
 *
 * USAGE:
 * questDecisionNodesMissingBranchesTransformer({flows});
 * // Returns ErrorMessage[] — e.g. ["flow 'login' decision 'check-auth' has 1 outgoing edges (need ≥2)"].
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

const MIN_DECISION_OUTGOING = 2;

export const questDecisionNodesMissingBranchesTransformer = ({
  flows,
}: {
  flows?: Flow[];
}): ErrorMessage[] => {
  if (!flows) {
    return [];
  }

  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    for (const node of flow.nodes) {
      if (node.type !== 'decision') {
        continue;
      }
      const outgoingCount = flow.edges.filter(
        (edge) => String(edge.from) === String(node.id),
      ).length;
      if (outgoingCount < MIN_DECISION_OUTGOING) {
        offenders.push(
          errorMessageContract.parse(
            `flow '${String(flow.id)}' decision '${String(node.id)}' has ${outgoingCount} outgoing edges (need ≥2)`,
          ),
        );
      }
    }
  }

  return offenders;
};
