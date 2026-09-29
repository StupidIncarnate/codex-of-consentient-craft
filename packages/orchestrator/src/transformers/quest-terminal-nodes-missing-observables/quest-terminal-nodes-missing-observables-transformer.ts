/**
 * PURPOSE: Returns descriptions of terminal flow nodes that have no observables
 *
 * USAGE:
 * questTerminalNodesMissingObservablesTransformer({flows});
 * // Returns ErrorMessage[] — e.g. ["flow 'login' terminal node 'done' has no observables"].
 */
import type { Flow } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

export const questTerminalNodesMissingObservablesTransformer = ({
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
      if (node.type !== 'terminal') {
        continue;
      }
      if (node.observables.length === 0) {
        offenders.push(
          errorMessageContract.parse(
            `flow '${String(flow.id)}' terminal node '${String(node.id)}' has no observables`,
          ),
        );
      }
    }
  }

  return offenders;
};
