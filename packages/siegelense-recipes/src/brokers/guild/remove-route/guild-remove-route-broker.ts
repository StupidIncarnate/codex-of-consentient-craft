/**
 * PURPOSE: The guild ingredient's `remove` route — deletes one guild through
 * `StartOrchestrator.removeGuild`. Reach for `StartOrchestrator` over `guildRemoveBroker`
 * itself: the latter is internal to `@dungeonmaster/orchestrator` (absent from its
 * `src/index.ts`), so this thin wrapper — which calls the real `guildRemoveBroker` through
 * `GuildFlow.remove` — is the one path this package can reach it through. Sequential deletes:
 * concurrent DELETEs corrupt `config.json` (a race on read-modify-write), which is why the
 * runner this route serves is serial, never a caller's own loop.
 *
 * USAGE:
 * await guildRemoveRouteBroker({ target, record: guild });
 * // Removes the guild from config.json; quest files on disk are preserved
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { guildIdContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const guildRemoveRouteBroker = async ({
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<AdapterResult> =>
  StartOrchestrator.removeGuild({ guildId: guildIdContract.parse(record.id) });
