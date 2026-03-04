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

const GUILD_PATH = '/tmp/dm-e2e-quest-approve';
const JSON_INDENT = 2;
const HTTP_OK = 200;

const createQuestFile = ({
  guildId,
  questId,
  sessionId,
  status,
}: {
  guildId: string;
  questId: string;
  sessionId: string;
  status: string;
}): void => {
  const homeDir = os.homedir();
  const questFolder = '001-e2e-approve';
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Approve Quest',
    status,
    createdAt: new Date().toISOString(),
    questCreatedSessionBy: sessionId,
    requirements: [],
    designDecisions: [],
    contexts: [],
    observables: [],
    steps: [],
    toolingRequirements: [],
    contracts: [],
    flows: [
      {
        id: crypto.randomUUID(),
        name: 'Test Flow',
        diagram: 'graph TD\n  A-->B',
        entryPoint: 'A',
        exitPoints: ['B'],
        requirementIds: [],
      },
    ],
  };

  writeFileSync(path.join(questDir, 'quest.json'), JSON.stringify(quest, null, JSON_INDENT));
};

test.describe('Quest Approve Button', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('clicking APPROVE sends PATCH with next status transition', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Approve Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-approve-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build the feature',
    });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId, status: 'created' });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('PANEL_HEADER')).toHaveText('FLOW APPROVAL');

    // Intercept the PATCH request to verify it sends the status transition
    const patchPromise = page.waitForRequest(
      (req) => req.method() === 'PATCH' && req.url().includes(`/api/quests/${questId}`),
      { timeout: 5000 },
    );

    await page.getByRole('button', { name: 'APPROVE' }).click();

    const patchRequest = await patchPromise;
    const body = patchRequest.postDataJSON();
    expect(body).toHaveProperty('status', 'flows_approved');
  });
});
