/**
 * PURPOSE: The `guild-active-suite` recipe — one active guild holding two quests (one in progress,
 * one complete) and a session with subagent chain. Reach for this over other recipes when testing
 * composite environments with concurrent guild, quest, session and subagent artifacts.
 *
 * USAGE:
 * const plan = recipesGuildActiveSuiteBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
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
        }),
        q[1].setRaw({
          status: questFieldsContract.shape.status.parse('complete'),
          title: questFieldsContract.shape.title.parse('Base Framework'),
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
