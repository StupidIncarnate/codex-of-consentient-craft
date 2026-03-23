import { writeFileSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  createSessionFile,
  cleanSessionDirectory,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-spec-panel';
const JSON_INDENT = 2;
const HTTP_OK = 200;

test.describe('Quest Spec Panel', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
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

    // Create quest via API to get the server-resolved file path
    const created = await createQuest(request, {
      guildId,
      title: 'E2E Spec Panel Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

    // Overwrite quest.json with desired test data
    const quest = {
      id: questId,
      folder: questFolder,
      title: 'E2E Spec Panel Quest',
      status: 'approved',
      createdAt: new Date().toISOString(),
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          status: 'complete',
          spawnerType: 'agent',
          sessionId,
          createdAt: new Date().toISOString(),
          relatedDataItems: [],
          dependsOn: [],
        },
      ],
      userRequest: 'Build the feature',
      designDecisions: [],
      steps: [],
      toolingRequirements: [],
      contracts: [],
      flows: [
        {
          id: 'test-flow',
          name: 'Test Flow',
          entryPoint: 'Start',
          exitPoints: ['End'],
          nodes: [],
          edges: [],
        },
      ],
    };
    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));

    // Navigate directly to session page and wait for guild + session data to load
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await guildsResponsePromise;

    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();

    // The spec panel should render instead of the "Awaiting quest activity..." text
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Awaiting quest activity...')).not.toBeVisible();
  });
});
