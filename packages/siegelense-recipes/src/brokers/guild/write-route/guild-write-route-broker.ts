/**
 * PURPOSE: The guild ingredient's `write` route — makes the directory the guild is about to
 * register, then registers it through `guildAddBroker`. Reach for it via the orchestrator's
 * `/brokers` subpath rather than `StartOrchestrator.addGuild`: the main
 * `@dungeonmaster/orchestrator` barrel evaluates `startup/start-orchestrator.ts` on import,
 * which boots a rate-limits watcher and a stale-process watchdog at module scope — the `/brokers`
 * subpath re-exports `guildAddBroker` directly from its own file, so importing it pulls in none
 * of that. `copies: 'guildAddBroker'` still names the real code this route's effect traces to.
 *
 * USAGE:
 * await guildWriteRouteBroker({ target, fields: { name, path } });
 * // Returns a Guild — id, urlSlug and createdAt minted by the real guildAddBroker
 */
import { guildAddBroker } from '@dungeonmaster/orchestrator/brokers';
import { fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { Guild } from '@dungeonmaster/shared/contracts';

import { guildFieldsContract } from '../../../contracts/guild-fields/guild-fields-contract';
import { guildPathDeriveTransformer } from '../../../transformers/guild-path-derive/guild-path-derive-transformer';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const guildWriteRouteBroker = async ({
  target,
  fields,
}: {
  target: DmTarget;
  fields: Record<string, unknown>;
}): Promise<Guild> => {
  const parsedFields = guildFieldsContract.parse(fields);
  const path = guildPathDeriveTransformer({ target, path: parsedFields.path });

  await fsMkdirAdapter({ filepath: filePathContract.parse(path) });

  return guildAddBroker({ name: parsedFields.name, path });
};
