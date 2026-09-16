/**
 * PURPOSE: The `guild` ingredient — one guild registered against a directory on disk, with its
 * url slug derived from its name. Reach for this over calling `ingredient({...})` again
 * anywhere else: a second declaration under the same `name` is what `registry()` catches as a
 * duplicate, and every quest, operation and session in this package links to THIS one.
 *
 * NAMED `guild-ingredient-broker.ts`, NOT `guild-ingredient.ts` — a finding, not a preference.
 * `@dungeonmaster/eslint-plugin`'s `ban-dom-handles-in-ingredients` and
 * `ban-nondeterminism-in-ingredients` scope by the EXACT filename suffix `-ingredient.ts`/`.tsx`
 * (`isIngredientDeclarationFileGuard`), but `enforce-project-structure` — checked empirically by
 * trying both — refuses a `-ingredient.ts` file inside `brokers/` ("File must end with
 * '-broker.ts' for brokers/ folder") AND refuses a bare `src/guild/` domain folder outright
 * ("Unknown folder 'guild/'. Must use one of: statics, contracts, …"). No folder in this
 * package's architecture can hold a file matching the ingredient-declaration rules' own naming
 * convention, so this file is invisible to both of them until that is resolved upstream (in
 * `@dungeonmaster/eslint-plugin` or the architecture's folder-type list, neither owned by this
 * package). Determinism here is held by construction and by this file's own colocated test,
 * not by either lint rule — see this package's CLAUDE.md.
 *
 * `path` is never in `defaults`' own literal claim, but IS in its return value: `defaults(index)`
 * sees only the index, never the target, so it mints a RELATIVE fragment
 * (`guilds-under-test/guild-<n>`) rather than an absolute path — `guildPathDeriveTransformer`,
 * called by both the `write` and `api` routes, is what turns it absolute against `target.home`.
 * Both routes derive it the same way, so they cannot disagree on where a seeded guild's directory
 * lands.
 *
 * `guildAddBroker` mints the id with `crypto.randomUUID()` and the slug via
 * `nameToUrlSlugTransformer`, touching no server — so this ingredient declares `write` (not just
 * `api`), which is what lets a Jest integration test with no base URL seed a guild at all.
 *
 * `fields: guildFieldsSchemaContract`, not `guildFieldsContract` directly — see that file's own
 * header for why: `ingredient()` checks a concrete `ZodObject` against two independently-inferred
 * phantom-carrier sites, which fails for any shape holding branded fields unless the value handed
 * to `fields` is upcast to `z.ZodType<GuildFields>` first. `defaults` below still reads
 * `guildFieldsContract.shape.<field>` — the upcast export drops `.shape`, so `defaults` keeps the
 * concrete contract.
 *
 * USAGE:
 * const dm = registry({ guilds: guildIngredientBroker, … });
 * dm.guilds.add(1, (g) => [g[0].set({ name: 'My App' })]);
 */
import { guildContract } from '@dungeonmaster/shared/contracts';

import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';
import { guildFieldsContract } from '../../../contracts/guild-fields/guild-fields-contract';
import { guildFieldsSchemaContract } from '../../../contracts/guild-fields-schema/guild-fields-schema-contract';
import { guildApiRouteBroker } from '../api-route/guild-api-route-broker';
import { guildQueryRouteBroker } from '../query-route/guild-query-route-broker';
import { guildRemoveRouteBroker } from '../remove-route/guild-remove-route-broker';
import { guildWriteRouteBroker } from '../write-route/guild-write-route-broker';
import type { GuildFields } from '../../../contracts/guild-fields/guild-fields-contract';

const { ingredient } = recipesHydrationCreateBroker();

export const guildIngredientBroker = ingredient({
  name: 'guild',
  description:
    'one guild registered against a directory on disk, with its url slug derived from its name',
  fields: guildFieldsSchemaContract,
  record: guildContract,
  defaults: (index: number): Partial<GuildFields> => ({
    name: guildFieldsContract.shape.name.parse(`Guild ${index + 1}`),
    path: guildFieldsContract.shape.path.parse(`guilds-under-test/guild-${index + 1}`),
  }),
  routes: {
    api: guildApiRouteBroker,
    write: guildWriteRouteBroker,
    query: guildQueryRouteBroker,
    remove: guildRemoveRouteBroker,
  },
  copies: 'guildAddBroker',
});
