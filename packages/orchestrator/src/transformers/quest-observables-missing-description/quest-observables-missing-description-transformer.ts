/**
 * PURPOSE: Returns descriptions of observables with empty description fields
 *
 * USAGE:
 * questObservablesMissingDescriptionTransformer({flows});
 * // Returns ErrorMessage[] — e.g. ["flow 'login' node 'done' observable 'obs-1' has empty description"].
 */
import type { Flow } from '@dungeonmaster/shared/contracts';

export const questObservablesMissingDescriptionTransformer = ({
  flows,
}: {
  flows?: Flow[];
}): string[] => {
  if (!flows) {
    return [];
  }

  const offenders: string[] = [];

  for (const flow of flows) {
    for (const node of flow.nodes) {
      for (const observable of node.observables) {
        const { description } = observable;
        const isEmpty = typeof description !== 'string' || description.length === 0;
        if (isEmpty) {
          offenders.push(
            `flow '${String(flow.id)}' node '${String(node.id)}' observable '${String(observable.id)}' has empty description`,
          );
        }
      }
    }
  }

  return offenders;
};
