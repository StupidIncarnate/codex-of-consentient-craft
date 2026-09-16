/**
 * PURPOSE: The operation ingredient's `query` route — loads the linked quest, then filters its
 * operations ledger. `where` must carry `questId`: an operation lives inside its quest's own
 * `operations[]` array, never in a location of its own, so the scope has to be named explicitly.
 *
 * USAGE:
 * await operationQueryRouteBroker({ target, where: { questId: 'add-auth', role: 'riftcarver' } });
 * // Returns every operation on that quest whose role is 'riftcarver'
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { questIdContract } from '@dungeonmaster/shared/contracts';
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
  const getResult = await StartOrchestrator.getQuest({ questId: questIdContract.parse(questId) });

  if (!getResult.success || !getResult.quest) {
    throw new Error(`operationQueryRouteBroker: quest ${String(questId)} not found`);
  }

  return getResult.quest.operations.filter((operation) =>
    matchesWhereClauseGuard({ record: operation, where: rest }),
  );
};
