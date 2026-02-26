import * as crypto from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createSessionFile,
  cleanSessionDirectory,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-spec-panel';
const JSON_INDENT = 2;
const HTTP_OK = 200;

/**
 * Writes a quest.json to disk so the session list broker can correlate the session to the quest.
 * Uses a 001- prefixed folder so questListBroker's isQuestFolderGuard allows it.
 */
const createQuestFile = ({
  guildId,
  questId,
  sessionId,
}: {
  guildId: string;
  questId: string;
  sessionId: string;
}): void => {
  const homeDir = os.homedir();
  const questFolder = '001-e2e-spec-panel';
  const questDir = path.join(
    homeDir,
    '.dungeonmaster',
    'guilds',
    guildId,
    'quests',
    questFolder,
  );
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Spec Panel Quest',
    status: 'approved',
    createdAt: new Date().toISOString(),
    questCreatedSessionBy: sessionId,
    requirements: [
      {
        id: crypto.randomUUID(),
        name: 'Test Requirement',
        description: 'A requirement for e2e testing',
        scope: 'packages/web',
        status: 'approved',
      },
    ],
    designDecisions: [],
    contexts: [],
    observables: [],
    steps: [],
    toolingRequirements: [],
    contracts: [],
    flows: [],
  };

  writeFileSync(path.join(questDir, 'quest.json'), JSON.stringify(quest, null, JSON_INDENT));
};

test.describe('Quest Spec Panel', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('session with linked quest shows spec panel instead of awaiting message', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Spec Panel Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-spec-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build the feature',
    });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId });

    // Navigate directly to session page and wait for guild + session data to load
    const urlSlug = String(guild.urlSlug ?? guild.name).toLowerCase().replace(/\s+/gu, '-');
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();

    // The spec panel should render instead of the "Awaiting quest activity..." text
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Awaiting quest activity...')).not.toBeVisible();
  });
});
