/**
 * PURPOSE: Seeds quest JSON files directly on disk for integration tests that cannot use responders due to import restrictions
 *
 * USAGE:
 * const seeder = questSeedHarness();
 * seeder.seed({ tempDir: testbed.guildPath, quest: QuestStub({ id: 'my-quest', folder: '001-my-quest' }) });
 */
import * as fs from 'fs';
import * as path from 'path';

import type { QuestStub } from '@dungeonmaster/shared/contracts';

const JSON_INDENT_SPACES = 2;
const GUILD_ID = '00000000-0000-0000-0000-000000000001';

export const questSeedHarness = (): {
  seed: (params: { tempDir: string; quest: ReturnType<typeof QuestStub> }) => void;
} => ({
  seed: ({ tempDir, quest }: { tempDir: string; quest: ReturnType<typeof QuestStub> }): void => {
    const questDir = path.join(tempDir, 'guilds', GUILD_ID, 'quests', quest.folder);
    fs.mkdirSync(questDir, { recursive: true });
    fs.writeFileSync(
      path.join(questDir, 'quest.json'),
      JSON.stringify(quest, null, JSON_INDENT_SPACES),
    );
  },
});
