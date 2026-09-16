/**
 * PURPOSE: The guild ingredient's `remove` route — deletes one guild through `guildRemoveBroker`,
 * reached BY PATH from the orchestrator's `/brokers` subpath rather than through
 * `StartOrchestrator.removeGuild`: the main `@dungeonmaster/orchestrator` barrel evaluates
 * `startup/start-orchestrator.ts` on import, which boots a rate-limits watcher and a
 * stale-process watchdog at module scope, and this package is a short-lived hydration tool, not
 * the long-running server those exist for. `StartOrchestrator.removeGuild` additionally sweeps
 * `orchestrationProcessesState`/`questExecutionQueueState` for stale entries belonging to the
 * removed guild's quests — live-server bookkeeping this package never populates, since it never
 * runs the orchestrator's own dispatch loop, so calling the bare broker drops nothing observable
 * here. Sequential deletes: concurrent DELETEs corrupt `config.json` (a race on
 * read-modify-write), which is why the runner this route serves is serial, never a caller's own
 * loop.
 *
 * USAGE:
 * await guildRemoveRouteBroker({ target, record: guild });
 * // Removes the guild from config.json; quest files on disk are preserved
 */
import { guildRemoveBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildIdContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const guildRemoveRouteBroker = async ({
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<AdapterResult> => guildRemoveBroker({ guildId: guildIdContract.parse(record.id) });
