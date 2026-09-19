/**
 * PURPOSE: The operation ingredient's `query` route — loads the linked quest, then filters its
 * operations ledger. `where` must carry `questId`: an operation lives inside its quest's own
 * `operations[]` array, never in a location of its own, so the scope has to be named explicitly.
 * Reaches `questGetBroker` BY PATH from the orchestrator's `/brokers` subpath rather than through
 * `StartOrchestrator` on the main barrel: importing anything from that barrel evaluates
 * `startup/start-orchestrator.ts`, which boots a rate-limits watcher and a stale-process watchdog
 * at module scope, and this package is a short-lived hydration tool, not the long-running server
 * those exist for.
 *
 * USAGE:
 * await operationQueryRouteBroker({ target, where: { questId: 'add-auth', role: 'riftcarver' } });
 * // Returns every operation on that quest whose role is 'riftcarver'
 */
import { questGetBroker } from '@dungeonmaster/orchestrator/brokers';
import { getQuestInputContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { OperationItem } from '@dungeonmaster/shared/contracts';

import { matchesWhereClauseGuard } from '../../../guards/matches-where-clause/matches-where-clause-guard';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const operationQueryRouteBroker = async ({
  where,
}: {
  target: DmTarget;
  where: Record<string, unknown>;
}): Promise<OperationItem[]> => {
  const { questId, ...rest } = where;
  const getResult = await questGetBroker({
    input: getQuestInputContract.parse({ questId: questIdContract.parse(questId) }),
  });

  if (!getResult.success || !getResult.quest) {
    throw new Error(`operationQueryRouteBroker: quest ${String(questId)} not found`);
  }

  return getResult.quest.operations.filter((operation) =>
    matchesWhereClauseGuard({ record: operation, where: rest }),
  );
};
