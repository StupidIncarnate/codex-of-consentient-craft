/**
 * PURPOSE: The `guild-active-suite` recipe — one active guild holding two quests (one in progress,
 * one complete) and a session with subagent chain. Reach for this over other recipes when testing
 * composite environments with concurrent guild, quest, session and subagent artifacts.
 *
 * Both quests' `setRaw` carry `flows`/`packagesAffected` (`questGateContentDefaultsStatics`) — on a
 * live target, `questApiRouteBroker` walks each freshly-minted `created` quest to its requested
 * status through `questReachRouteBroker`, and that walk needs real gate content to clear
 * `flows_approved`/`approved` the same way `guild-mid-execution`'s own header explains (DEF-71).
 * This recipe holds no operations ledger of its own, so the riftcarver operation a live target's
 * real START route auto-seeds on the way to `in_progress`/`complete` is left as-is — nothing here
 * asserts the ledger shape.
 *
 * USAGE:
 * const plan = recipesGuildActiveSuiteBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { questGateContentDefaultsStatics } from '../../../statics/quest-gate-content-defaults/quest-gate-content-defaults-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

const QUESTS_COUNT = 2;

export const recipesGuildActiveSuiteBroker = recipe(
  {
    name: 'guild-active-suite',
    description:
      'one active guild holding two quests (one in progress, one complete) and a session with subagent chain',
  },
  () => [
    dmRegistryBroker.guilds.add(1, (g) => [
      g[0].quests.add(QUESTS_COUNT, (q) => [
        q[0].setRaw({
          status: questFieldsContract.shape.status.parse('in_progress'),
          title: questFieldsContract.shape.title.parse('Active Development'),
          flows: questFieldsContract.shape.flows.parse(questGateContentDefaultsStatics.flows),
          packagesAffected: questFieldsContract.shape.packagesAffected.parse(
            questGateContentDefaultsStatics.packagesAffected,
          ),
        }),
        q[1].setRaw({
          status: questFieldsContract.shape.status.parse('complete'),
          title: questFieldsContract.shape.title.parse('Base Framework'),
          flows: questFieldsContract.shape.flows.parse(questGateContentDefaultsStatics.flows),
          packagesAffected: questFieldsContract.shape.packagesAffected.parse(
            questGateContentDefaultsStatics.packagesAffected,
          ),
        }),
        q[0].saveRecordAs({ name: 'questActive' }),
        q[1].saveRecordAs({ name: 'questComplete' }),
      ]),
      g[0].sessions.add(1, (s) => [
        s[0].subagents.add(1, (a) => [a[0].saveRecordAs({ name: 'subagent' })]),
        s[0].saveRecordAs({ name: 'session' }),
      ]),
      g[0].saveRecordAs({ name: 'guild' }),
    ]),
  ],
);
