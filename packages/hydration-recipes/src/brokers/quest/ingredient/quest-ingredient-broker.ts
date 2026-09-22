/**
 * PURPOSE: The `quest` ingredient — one quest under a guild, at whatever status you set it to,
 * holding whatever work items and ledger you gave it. Named `quest-ingredient-broker.ts`, not
 * `quest-ingredient.ts` — see `guild-ingredient-broker.ts`'s own header for why: this repo's
 * `enforce-project-structure` refuses a `-ingredient.ts` file inside `brokers/` and refuses a bare
 * domain folder outside it, so no location satisfies `@dungeonmaster/eslint-plugin`'s own
 * `-ingredient.ts` filename convention today.
 *
 * `transitions.to` HOLDS a narrower runtime set than `QuestStatus` (18 values) — every value left
 * off is reached by something other than a caller asking. It reads
 * `questTransitionTargetStatusesStatics.value`, an inline literal tuple, rather than filtering
 * `questStatusContract.options` through `isTransitionTargetQuestStatusGuard` at this declaration
 * site: `@dungeonmaster-local/ban-quest-status-literals` refuses an inline array or set holding two
 * or more recognized status literals everywhere EXCEPT the one statics folder its allowlist now
 * names for exactly this list (see that statics file's own header), so the literal tuple can live
 * there and keep its narrow type. `to`'s STATIC TYPE is therefore the twelve-member literal union
 * the statics file declares, not the un-narrowed `QuestStatus[]` a `.filter()` call would produce —
 * `set({ status: 'blocked' })` correctly FAILS TO COMPILE here, matching the specification. The
 * pre-flight (`HydrationTransitionUnreachableError`) still refuses an unreachable status at RUN
 * time too, unchanged, since the statics list holds the identical runtime set the old `.filter()`
 * produced (`is-transition-target-quest-status-guard.test.ts` pins the two together). Below is why
 * each excluded value is excluded:
 * - `created` — the row's own starting value, minted by `defaults`/the create route. Nothing
 *   transitions BACK to it.
 * - `pending` — no live code path in `@dungeonmaster/orchestrator` ever sets a QUEST's status to
 *   this value (every `'pending'` hit in that package's source is a WORK ITEM's status, a different
 *   field); its edge list mirrors `created`'s exactly, which reads as a vestigial predecessor name
 *   from an earlier schema rather than a state any real flow produces.
 * - `paused` — `questModifyBroker` REFUSES a bare `status: 'paused'` write outright, by name:
 *   `"Status 'paused' must be set via POST /api/quests/:questId/pause, not modify-quest"`. Reaching
 *   it for real also kills every registered subprocess, which needs `state/` this package cannot
 *   import.
 * - `blocked` — set only by `quest-block-on-failure-broker` once a ward/riftcarver retry budget is
 *   spent, or an agent signals `blocked`. A caller does not ask for this; a failure produces it.
 * - `merging` / `merged` — minted only by `OrchestrationMergeResponder` pressing "Teleport with
 *   Booty", which appends a warpgate item and force-completes the rest of the ledger before the
 *   flip, and by that item's own eventual `git merge --squash`. Neither is a plain status ask, and
 *   the machinery behind both is out of this ingredient's reach.
 *
 * Every other status — the ChaosWhisperer spec lifecycle, `in_progress`, `complete` and
 * `abandoned` — IS reached by a caller literally asking `questModifyBroker` for it (`complete` and
 * `abandoned` are both legal next values off `in_progress` in `questStatusTransitionsStatics`, and
 * neither carries a `hasQuestGateContentGuard` requirement), so all of them stay on `to`.
 *
 * `reach` is `questReachRouteBroker`, group P4's own file, now wired on. It walks every ordinary hop
 * through `questModifyBroker` and reaches `in_progress` — the one hop that mints more than a field —
 * through the real `POST /api/quests/:questId/start` route, never a bare status write. See that
 * file's own header for the full reasoning and the escape-the-target finding it carries forward.
 *
 * `guildId` is not a field on `questContract` — a quest's parent is its FOLDER — so
 * `questFieldsContract` extends one key the record does not carry, purely so `links` has
 * somewhere to write it.
 *
 * `defaults` now also mints `status: 'created'`. Declaring `transitions` on `status` means
 * `opSetTransformer` ALWAYS splits a `set({status, ...})` call's status half into a standalone
 * transition op — even the very first `.set()` right after `add()` — so the CREATE route never
 * receives `status` through the fold any more. Without a default here, `questFieldsContract.parse`
 * (a REQUIRED field) throws `status: Required` on every quest a plan creates without an explicit
 * `setRaw({status: …})`.
 *
 * `copies: 'questPersistBroker'` names the broker the `write` route's effect imitates.
 * `questPersistBroker` itself is unreachable from this package (absent from
 * `@dungeonmaster/orchestrator`'s `src/index.ts` and its package.json `exports` map) — see
 * `questPersistDirectBroker`'s own header for the full finding. `copies:` still points at the
 * real broker being imitated, which is what the property is for.
 *
 * USAGE:
 * const dm = registry({ guilds: guildIngredientBroker, quests: questIngredientBroker });
 * dm.guilds.add(1, (g) => [g[0].quests.add(1, (q) => [q[0].set({ title: 'Add Auth', status: 'explore_flows' })])]);
 */
import { questContract } from '@dungeonmaster/shared/contracts';

import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';
import { corruptSchemaArgsContract } from '../../../contracts/corrupt-schema-args/corrupt-schema-args-contract';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { questFieldsSchemaContract } from '../../../contracts/quest-fields-schema/quest-fields-schema-contract';
import { wardResultDetailArgsContract } from '../../../contracts/ward-result-detail-args/ward-result-detail-args-contract';
import { questTransitionTargetStatusesStatics } from '../../../statics/quest-transition-target-statuses/quest-transition-target-statuses-statics';
import { questApiRouteBroker } from '../api-route/quest-api-route-broker';
import { questCorruptToLegacySchemaBroker } from '../corrupt-to-legacy-schema/quest-corrupt-to-legacy-schema-broker';
import { questQueryRouteBroker } from '../query-route/quest-query-route-broker';
import { questReachRouteBroker } from '../reach-route/quest-reach-route-broker';
import { questRemoveRouteBroker } from '../remove-route/quest-remove-route-broker';
import { questUpdateRouteBroker } from '../update-route/quest-update-route-broker';
import { questWardResultDetailWriteBroker } from '../ward-result-detail-write/quest-ward-result-detail-write-broker';
import { questWriteRouteBroker } from '../write-route/quest-write-route-broker';
import type { QuestFields } from '../../../contracts/quest-fields/quest-fields-contract';

const { ingredient } = recipesHydrationCreateBroker();

export const questIngredientBroker = ingredient({
  name: 'quest',
  description:
    'one quest under a guild, at whatever status you set it to, holding whatever work items and ledger you gave it',
  fields: questFieldsSchemaContract,
  record: questContract,
  links: [{ of: 'guild', as: 'guildId' }],
  defaults: (index: number): Partial<QuestFields> => ({
    title: questFieldsContract.shape.title.parse(`Quest ${index + 1}`),
    userRequest: questFieldsContract.shape.userRequest.parse(`seeded quest ${index + 1}`),
    status: questFieldsContract.shape.status.parse('created'),
  }),
  transitions: {
    field: 'status',
    to: questTransitionTargetStatusesStatics.value,
    reach: questReachRouteBroker,
  },
  routes: {
    api: questApiRouteBroker,
    write: questWriteRouteBroker,
    update: questUpdateRouteBroker,
    query: questQueryRouteBroker,
    remove: questRemoveRouteBroker,
  },
  copies: 'questPersistBroker',
  extras: {
    corruptToLegacySchema: {
      args: corruptSchemaArgsContract,
      apply: questCorruptToLegacySchemaBroker,
    },
    withWardResultDetail: {
      args: wardResultDetailArgsContract,
      apply: questWardResultDetailWriteBroker,
    },
  },
});
