/**
 * PURPOSE: Computes the sequence of hops a quest's status must pass through to get from `from` to
 * `to`, as a shortest path over `questStatusTransitionsStatics` — the SAME edge list
 * `questModifyBroker` itself enforces via `questHasValidStatusTransitionGuard`. Reach for this over
 * a single direct `questModifyBroker({status: to})` call: most of this repo's real status pairs are
 * not adjacent (`created` cannot reach `flows_approved` in one hop), and a caller asking a
 * transition for a non-adjacent `to` needs every intermediate status walked in order, exactly the
 * way a human clicking through the spec lifecycle would.
 *
 * The search never steps INTO a status `isTransitionTargetQuestStatusGuard` calls unaskable, unless
 * it is the final `to` itself. Without that filter, a real bug this file's own test caught: `paused`
 * has a direct edge to nearly every status (including `flows_approved`), so an unfiltered BFS from
 * `created` finds `created -> paused -> flows_approved` — two hops — SHORTER than the honest
 * `created -> explore_flows -> review_flows -> flows_approved` — three hops through real spec
 * states. Walking through `paused` for real means `questModifyBroker` REFUSES the hop outright
 * (`"Status 'paused' must be set via POST /api/quests/:questId/pause, not modify-quest"`), so the
 * shorter path is not merely uglier, it is not walkable at all.
 *
 * USAGE:
 * questStatusWalkPathTransformer({ from: 'created', to: 'flows_approved' });
 * // Returns ['explore_flows', 'review_flows', 'flows_approved'] — from excluded, to included
 */
import { questStatusContract } from '@dungeonmaster/shared/contracts';
import type { QuestStatus } from '@dungeonmaster/shared/contracts';
import { questStatusTransitionsStatics } from '@dungeonmaster/shared/statics';

import { isTransitionTargetQuestStatusGuard } from '../../guards/is-transition-target-quest-status/is-transition-target-quest-status-guard';

export const questStatusWalkPathTransformer = ({
  from,
  to,
}: {
  from: QuestStatus;
  to: QuestStatus;
}): QuestStatus[] => {
  if (from === to) {
    return [];
  }

  const cameFrom = new Map<QuestStatus, QuestStatus>();
  const visited = new Set<QuestStatus>([from]);
  let frontier: QuestStatus[] = [from];

  while (frontier.length > 0 && !visited.has(to)) {
    const nextFrontier: QuestStatus[] = [];
    for (const current of frontier) {
      const neighbors = questStatusTransitionsStatics[current] as readonly QuestStatus[];
      for (const neighbor of neighbors) {
        const walkable =
          neighbor === to || isTransitionTargetQuestStatusGuard({ status: neighbor });
        if (!visited.has(neighbor) && walkable) {
          visited.add(neighbor);
          cameFrom.set(neighbor, current);
          nextFrontier.push(neighbor);
        }
      }
    }
    frontier = nextFrontier;
  }

  if (!visited.has(to)) {
    throw new Error(
      `questStatusWalkPathTransformer: no status walk exists from "${from}" to "${to}"`,
    );
  }

  const path: QuestStatus[] = [];
  let step = to;
  while (step !== from) {
    path.unshift(questStatusContract.parse(step));
    const previous = cameFrom.get(step);
    if (previous === undefined) {
      throw new Error(
        `questStatusWalkPathTransformer: no status walk exists from "${from}" to "${to}"`,
      );
    }
    step = previous;
  }
  return path;
};
