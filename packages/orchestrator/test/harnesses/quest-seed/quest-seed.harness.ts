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
import * as fs from 'fs';
import * as path from 'path';

import type { QuestStub } from '@dungeonmaster/shared/contracts';

const JSON_INDENT_SPACES = 2;
const GUILD_ID = '00000000-0000-0000-0000-000000000001';

export const questSeedHarness = (): {
  seed: (params: {
    tempDir: string;
    quest: ReturnType<typeof QuestStub>;
    guildId?: string;
  }) => void;
} => ({
  seed: ({
    tempDir,
    quest,
    guildId = GUILD_ID,
  }: {
    tempDir: string;
    quest: ReturnType<typeof QuestStub>;
    guildId?: string;
  }): void => {
    const questDir = path.join(tempDir, 'guilds', guildId, 'quests', quest.folder);
    fs.mkdirSync(questDir, { recursive: true });
    fs.writeFileSync(
      path.join(questDir, 'quest.json'),
      JSON.stringify(quest, null, JSON_INDENT_SPACES),
    );
  },
});
