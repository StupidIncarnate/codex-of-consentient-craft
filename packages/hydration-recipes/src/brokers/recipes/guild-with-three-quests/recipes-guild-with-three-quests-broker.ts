/**
 * PURPOSE: The `guild-with-three-quests` recipe — one guild holding three quests: one created,
 * one in_progress, and one complete. Reach for this over other recipes when testing multi-quest
 * state progression under a single guild.
 *
 * `questInProgress` and `questComplete` are walked there through `set()` — the ingredient's real
 * `transitions.reach` — never `setRaw()`, because `hasQuestGateContentGuard` genuinely refuses
 * `flows_approved`/`approved` without non-empty `flows` and `questSaveInvariantsTransformer`
 * refuses `flows_approved` unless every node's package tag also appears in `packagesAffected`; a
 * status these two quests only claimed via `setRaw` was never actually reachable. `flows`/
 * `packagesAffected` come from `seedFixtureStatics.quest`, which already models this exact
 * gate-content shape.
 *
 * The write itself goes through `g[0].quests.filter({...}).set({flows, packagesAffected})`, never
 * `q[1].set({flows, ...})` on the row's own create-time handle: `planFoldWritesTransformer` folds
 * ANY top-level `set()` targeting a `create`'s own ref into that `create`'s `fields` — even one
 * also carrying a `transition`, which keeps only its transition half standalone — and `POST
 * /api/quests` never reads anything off the wire but `guildId`/`title`/`userRequest`, so a folded
 * `flows` write is silently discarded the moment a `baseUrl` target picks the `api` route over
 * `write`. A `filter()` match's `matchedRef` never equals a `create`'s ref, so its `set()` always
 * reaches the real `update` route instead.
 *
 * USAGE:
 * const plan = recipesGuildWithThreeQuestsBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { seedFixtureStatics } from '../../../statics/seed-fixture/seed-fixture-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

const QUEST_COUNT = 3;
const IN_PROGRESS_TITLE = questFieldsContract.shape.title.parse('Implement Authentication');
const COMPLETE_TITLE = questFieldsContract.shape.title.parse('Scaffold Architecture');
const GATE_FLOWS = questFieldsContract.shape.flows.parse(seedFixtureStatics.quest.flows);
const GATE_PACKAGES_AFFECTED = questFieldsContract.shape.packagesAffected.parse(
  seedFixtureStatics.quest.packagesAffected,
);

export const recipesGuildWithThreeQuestsBroker = recipe(
  {
    name: 'guild-with-three-quests',
    description: 'one guild holding three quests: one created, one in_progress, and one complete',
  },
  () => [
    dmRegistryBroker.guilds.add(1, (g) => [
      g[0].quests.add(QUEST_COUNT, (q) => [
        q[0].setRaw({
          status: questFieldsContract.shape.status.parse('created'),
          title: questFieldsContract.shape.title.parse('Setup Database'),
        }),
        q[1].setRaw({ title: IN_PROGRESS_TITLE }),
        q[2].setRaw({ title: COMPLETE_TITLE }),
        // The one hop safe to walk off the row's own create-time handle: no `written` half, so
        // nothing here is at risk of the create-fold above.
        q[1].set({ status: 'explore_flows' }),
        q[2].set({ status: 'explore_flows' }),
        q[0].saveRecordAs({ name: 'questCreated' }),
      ]),
      g[0].quests
        .filter({ where: { title: IN_PROGRESS_TITLE }, expect: 'one' })
        .set({ flows: GATE_FLOWS, packagesAffected: GATE_PACKAGES_AFFECTED }),
      g[0].quests
        .filter({ where: { title: COMPLETE_TITLE }, expect: 'one' })
        .set({ flows: GATE_FLOWS, packagesAffected: GATE_PACKAGES_AFFECTED }),
      // Both quests clear every gate up through `approved` before either one attempts
      // `in_progress`, the one hop that needs a live START route.
      g[0].quests
        .filter({ where: { title: IN_PROGRESS_TITLE }, expect: 'one' })
        .set({ status: 'approved' }),
      g[0].quests
        .filter({ where: { title: COMPLETE_TITLE }, expect: 'one' })
        .set({ status: 'approved' }),
      g[0].quests
        .filter({ where: { title: IN_PROGRESS_TITLE }, expect: 'one' })
        .set({ status: 'in_progress' }),
      g[0].quests
        .filter({ where: { title: IN_PROGRESS_TITLE }, expect: 'one' })
        .saveRecordAs({ name: 'questInProgress' }),
      // `reach`'s own BFS walks the `in_progress` hop (and its live START route) on the way to
      // `complete`, exactly as it would for a direct `in_progress` target above.
      g[0].quests
        .filter({ where: { title: COMPLETE_TITLE }, expect: 'one' })
        .set({ status: 'complete' }),
      g[0].quests
        .filter({ where: { title: COMPLETE_TITLE }, expect: 'one' })
        .saveRecordAs({ name: 'questComplete' }),
      g[0].saveRecordAs({ name: 'guild' }),
    ]),
  ],
);
