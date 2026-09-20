/**
 * PURPOSE: Seeds quest JSON files directly on disk for integration tests that cannot use responders due to import restrictions
 *
 * USAGE:
 * const seeder = questSeedHarness();
 * seeder.seed({ tempDir: testbed.guildPath, quest: QuestStub({ id: 'my-quest', folder: '001-my-quest' }) });
 * // Pass guildId to land the quest under a guild orchestrationQuestHarness.createGuildAndQuest
 * // already registered in config.json, so a broker that resolves the guild (guildGetBroker,
 * // questRepoRootBroker) finds it instead of a folder-name id nothing in config recognizes.
 */
import {
  absoluteFilePathContract,
  guildIdContract,
  questContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { dmRegistryBroker, recipesHydrationCreateBroker } from '@dungeonmaster/hydration-recipes';
import { dmTargetContract } from '@dungeonmaster/hydration-recipes/contracts';
import type { QuestFields } from '@dungeonmaster/hydration-recipes/contracts';

const GUILD_ID = '00000000-0000-0000-0000-000000000001';

const { recipe } = recipesHydrationCreateBroker();

export const questSeedHarness = (): {
  seed: (params: {
    tempDir: string;
    quest: ReturnType<typeof QuestStub>;
    guildId?: string;
  }) => Promise<void>;
} => ({
  seed: async ({
    tempDir,
    quest,
    guildId = GUILD_ID,
  }: {
    tempDir: string;
    quest: ReturnType<typeof QuestStub>;
    guildId?: string;
  }): Promise<void> => {
    const target = dmTargetContract.parse({
      home: absoluteFilePathContract.parse(tempDir),
      claudeHome: absoluteFilePathContract.parse(tempDir),
    });

    const plan = recipe(
      { name: 'orchestrator-seed-quest', description: 'seed quest via write route' },
      () => [
        dmRegistryBroker.quests.under({ guildId: guildIdContract.parse(guildId) }).add(1, (q) => [
          q[0].setRaw({
            ...quest,
            id: questIdContract.parse(quest.id),
            folder: questContract.shape.folder.parse(quest.folder),
          } as Partial<QuestFields>),
        ]),
      ],
    )();

    await dmRegistryBroker.run(plan, target);
  },
});
