/**
 * PURPOSE: The guild ingredient's `write` route — creates the directory the guild registers
 * against, then registers it through `guildAddBroker`. Reach for it via the orchestrator's
 * `/brokers` subpath rather than `StartOrchestrator.addGuild`: the main
 * `@dungeonmaster/orchestrator` barrel evaluates `startup/start-orchestrator.ts` on import,
 * which boots a rate-limits watcher and a stale-process watchdog at module scope — the `/brokers`
 * subpath re-exports `guildAddBroker` directly from its own file, so importing it pulls in none
 * of that. `copies: 'guildAddBroker'` still names the real code this route's effect traces to.
 *
 * THE MKDIR IS FENCED TO THE TARGET, through `guildDirectoryEnsureBroker` — shared with the `api`
 * route (DEF-72) so the two can never disagree about which paths get created. It CREATES the
 * directory because `defaults(index)` mints a relative fragment (`guilds-under-test/guild-<n>`)
 * that exists nowhere until something makes it, and `guildAddBroker` makes a DIFFERENT directory —
 * `<home>/guilds/<id>/quests`, the dungeonmaster-side record — never the one a guild POINTS AT. A
 * guild whose `path` is unreachable comes back from `guildListBroker`, and so from this
 * ingredient's own `query` route, carrying `valid: false`, so dropping the mkdir seeds a target
 * full of invalid guilds. It creates NOTHING outside the target because an already-absolute `path`
 * names a real directory on the operator's own machine — `guildPathDeriveTransformer` passes one
 * through unchanged for exactly that case — and mkdir'ing it is a write nobody asked for, in a
 * place no `cleanup()` reaches. A path resolving outside `target.home` is therefore registered
 * exactly as given and left uncreated, which is what keeps every path this route touches inside
 * the target it was handed. See `guild-directory-ensure-broker.ts`'s own header for the resolve-
 * before-compare / compare-with-the-separator mechanics that make the fence itself correct.
 *
 * THE REGISTRATION IS FENCED THE SAME WAY, by `home: target.home`. `guildAddBroker` resolves its
 * home from `DUNGEONMASTER_HOME` when no caller supplies one, so a route that omitted this would
 * fence its own mkdir to the target and then register the guild — `config.json` and
 * `guilds/<id>/quests` both — in whatever dungeonmaster home the process happened to inherit.
 * Handing it `target.home` is what makes the fence above cover the whole route rather than the one
 * directory this file builds itself, and it is why a caller no longer has to pin the env var
 * around a seed for the registration to land.
 *
 * `fields.id` is read straight off the raw object, not through `guildFieldsContract` — that
 * contract's own header says the server mints `id`, so it declares no field for it. A caller wanting
 * the SAME id on both an `api`-route write and a `write`-route write of one guild (the two-route
 * comparison a hydration recipe drives) passes it as this extra key; every other caller omits it and
 * `guildAddBroker` mints one exactly as before.
 *
 * `guildUniquePathResolveBroker` runs BEFORE the path is derived absolute — DEF-78 — so composing
 * two guild recipes into one target (or seeding `guild-empty` twice) never sends the identical
 * literal `guilds-under-test/guild-1` to `guildAddBroker` twice: the second seed's default fragment
 * bumps to `guild-2` because `guild-1`'s directory already exists under this same target. See that
 * broker's own header for why this is a route concern, not an ingredient one.
 *
 * USAGE:
 * await guildWriteRouteBroker({ target, fields: { name, path } });
 * // Returns a Guild — id, urlSlug and createdAt minted by the real guildAddBroker
 *
 * await guildWriteRouteBroker({ target, fields: { name, path, id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' } });
 * // Returns a Guild carrying exactly that id
 */
import { guildAddBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildIdContract } from '@dungeonmaster/shared/contracts';
import type { Guild } from '@dungeonmaster/shared/contracts';

import { guildDirectoryEnsureBroker } from '../directory-ensure/guild-directory-ensure-broker';
import { guildUniquePathResolveBroker } from '../unique-path-resolve/guild-unique-path-resolve-broker';
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
  const uniquePath = guildUniquePathResolveBroker({ target, path: parsedFields.path });
  const path = guildPathDeriveTransformer({ target, path: uniquePath });

  await guildDirectoryEnsureBroker({ target, path });

  const id = guildIdContract.optional().parse(fields.id);

  return id === undefined
    ? guildAddBroker({ name: parsedFields.name, path, home: target.home })
    : guildAddBroker({ name: parsedFields.name, path, id, home: target.home });
};
