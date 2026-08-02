/**
 * PURPOSE: Provides test environment setup and helpers for server flow integration tests
 *
 * USAGE:
 * const server = serverAppHarness();
 * const restore = server.setupTestHome({ baseName: 'my-test' });
 * const body = server.toPlain(await response.json());
 * restore();
 */
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';

export const serverAppHarness = (): {
  setupTestHome: (params: { baseName: string }) => () => void;
  toPlain: (value: unknown) => unknown;
  seedQuest: (params: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
    quest: unknown;
  }) => void;
} => {
  const setupTestHome = ({ baseName }: { baseName: string }): (() => void) => {
    const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
    const tempDir = join(tmpdir(), `${baseName}-${randomUUID().slice(0, 8)}`);
    process.env.DUNGEONMASTER_HOME = tempDir;
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(join(tempDir, 'config.json'), JSON.stringify({ guilds: [] }));

    return (): void => {
      if (savedDungeonmasterHome === undefined) {
        Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      } else {
        process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
      }
      rmSync(tempDir, { recursive: true, force: true });
    };
  };

  const toPlain = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

  // Writes a quest.json straight onto disk under an already-`setupTestHome`'d DUNGEONMASTER_HOME,
  // the same way mcp-server.harness.ts's seedQuest does for the MCP subprocess suite. The
  // orchestrator's quest lookup globs guilds/*/quests/*/quest.json — it does not require the
  // guild to be registered in config.json first.
  const seedQuest = ({
    dungeonmasterHome,
    guildId,
    questFolder,
    quest,
  }: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
    quest: unknown;
  }): void => {
    const questDir = join(dungeonmasterHome, 'guilds', guildId, 'quests', questFolder);
    mkdirSync(questDir, { recursive: true });
    writeFileSync(join(questDir, 'quest.json'), JSON.stringify(quest, null, 2));
  };

  return {
    setupTestHome,
    toPlain,
    seedQuest,
  };
};
