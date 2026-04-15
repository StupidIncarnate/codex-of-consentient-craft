/**
 * PURPOSE: Returns descriptions of cycles found in the step dependsOn graph
 *
 * USAGE:
 * questCyclicStepDepsTransformer({steps});
 * // Returns ErrorMessage[] — e.g. ["cycle in step dependsOn: 'a' -> 'b' -> 'a'"].
 *
 * Iterative DFS: each frame holds the remaining neighbors to explore as an array we shift from.
 * When a neighbor is already on the active stack, we record a cycle description.
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questCyclicStepDepsTransformer = ({
  steps,
}: {
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!steps) {
    return [];
  }

  const adjacency = new Map<unknown, unknown[]>();
  for (const step of steps) {
    adjacency.set(
      String(step.id),
      step.dependsOn.map((dep) => String(dep)),
    );
  }

  const visited = new Set<unknown>();
  const offenders: ErrorMessage[] = [];

  for (const rootId of adjacency.keys()) {
    if (visited.has(rootId)) {
      continue;
    }

    const frames: { nodeId: unknown; remaining: unknown[]; path: unknown[] }[] = [
      { nodeId: rootId, remaining: [...(adjacency.get(rootId) ?? [])], path: [] },
    ];
    const active = new Set<unknown>([rootId]);

    for (; frames.length > 0; ) {
      const top = frames[frames.length - 1];
      if (!top) {
        break;
      }

      if (top.remaining.length === 0) {
        active.delete(top.nodeId);
        visited.add(top.nodeId);
        frames.pop();
        continue;
      }

      const next = top.remaining.shift();
      if (next === undefined) {
        continue;
      }

      if (active.has(next)) {
        const cyclePath = [...top.path, top.nodeId, next]
          .map((id) => `'${String(id)}'`)
          .join(' -> ');
        offenders.push(errorMessageContract.parse(`cycle in step dependsOn: ${cyclePath}`));
        continue;
      }

      if (visited.has(next)) {
        continue;
      }

      active.add(next);
      frames.push({
        nodeId: next,
        remaining: [...(adjacency.get(next) ?? [])],
        path: [...top.path, top.nodeId],
      });
    }
  }

  return offenders;
};
