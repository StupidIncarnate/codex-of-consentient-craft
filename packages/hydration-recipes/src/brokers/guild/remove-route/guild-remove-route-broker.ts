/**
 * PURPOSE: The guild ingredient's `remove` route — deletes one guild. On a target that carries a
 * `baseUrl` (an api-capable target, whether it dispatches through `target.request` or the global
 * `fetch` — `dmHttpRequestAdapter` picks between the two, and `dmTargetContract`'s own refine makes
 * `request` impossible without `baseUrl`, so checking `baseUrl` alone covers both), this route sends
 * the real `DELETE /api/guilds/:guildId` and so reaches `GuildRemoveResponder`, which sweeps
 * `orchestrationProcessesState`/`questExecutionQueueState` for stale entries belonging to the
 * removed guild's quests. Calling `guildRemoveBroker` in-process — what this route did before, and
 * still does on a write-only target — skips that sweep, because it never runs the orchestrator's own
 * dispatch loop this package's own process never populates. `questReachRouteBroker` follows the same
 * `target.baseUrl === undefined` check for the identical reason: a write-only target has no route to
 * server-side bookkeeping, only to `config.json` and the quest files themselves. Sequential deletes:
 * concurrent DELETEs corrupt `config.json` (a race on read-modify-write), which is why the runner
 * this route serves is serial, never a caller's own loop.
 *
 * USAGE:
 * await guildRemoveRouteBroker({ target, record: guild });
 * // Removes the guild from config.json (and sweeps orchestration state when target.baseUrl is set);
 * // quest files on disk are preserved
 */
import { guildRemoveBroker } from '@dungeonmaster/orchestrator/brokers';
import { adapterResultContract, guildIdContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { dmHttpRequestAdapter } from '../../../adapters/dm-http/request/dm-http-request-adapter';
import { dmHttpResponseUnwrapAdapter } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const guildRemoveRouteBroker = async ({
  target,
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<AdapterResult> => {
  const guildId = guildIdContract.parse(record.id);

  if (target.baseUrl === undefined) {
    return guildRemoveBroker({ guildId });
  }

  const path = `/api/guilds/${guildId}`;
  const response = await dmHttpRequestAdapter({ target, method: 'DELETE', path });
  const body = dmHttpResponseUnwrapAdapter({ response, url: `${target.baseUrl}${path}` });
  return adapterResultContract.parse(body);
};
