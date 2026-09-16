/**
 * PURPOSE: The guild ingredient's `write` route — makes the directory the guild is about to
 * register, then registers it through `StartOrchestrator.addGuild`. Reach for
 * `StartOrchestrator` rather than `guildAddBroker` itself: `guildAddBroker` is internal to
 * `@dungeonmaster/orchestrator` (absent from its `src/index.ts` and from its package.json
 * `exports` map, which lists only `.` and `./testing`), so `StartOrchestrator.addGuild` — a
 * thin wrapper over `GuildFlow.add`, which calls the real `guildAddBroker` — is the one path
 * this package can reach it through at all. `copies: 'guildAddBroker'` still names the real
 * code this route's effect traces to.
 *
 * USAGE:
 * await guildWriteRouteBroker({ target, fields: { name, path } });
 * // Returns a Guild — id, urlSlug and createdAt minted by the real guildAddBroker
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
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

  return StartOrchestrator.addGuild({ name: parsedFields.name, path });
};
