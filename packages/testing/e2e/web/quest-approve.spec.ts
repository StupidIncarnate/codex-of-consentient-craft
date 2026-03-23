import { mkdirSync, writeFileSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  createSessionFile,
  cleanSessionDirectory,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-approve';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const SPEC_PANEL_TIMEOUT = 5_000;
const PATCH_TIMEOUT = 3_000;

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

    // Create quest via API to get the server-resolved file path
    const created = await createQuest(request, {
      guildId,
      title: 'E2E Approve Quest',
      userRequest: 'Build the feature',
    });
    const questId = created.questId;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

    // Overwrite quest.json with desired status, work items, and flows
    const quest = {
      id: questId,
      folder: questFolder,
      title: 'E2E Approve Quest',
      status: 'review_flows',
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
          entryPoint: 'start',
          exitPoints: ['end'],
          nodes: [
            { id: 'start', label: 'Start', type: 'state', observables: [] },
            { id: 'end', label: 'End', type: 'terminal', observables: [] },
          ],
          edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
        },
      ],
    };
    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await guildsResponsePromise;

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: SPEC_PANEL_TIMEOUT });
    await expect(page.getByTestId('PANEL_HEADER')).toHaveText('FLOW APPROVAL');

    // Intercept the PATCH request to verify it sends the status transition
    const patchPromise = page.waitForRequest(
      (req) => req.method() === 'PATCH' && req.url().includes(`/api/quests/${questId}`),
      { timeout: PATCH_TIMEOUT },
    );

    await page.getByRole('button', { name: 'APPROVE' }).click();

    const patchRequest = await patchPromise;
    const body = patchRequest.postDataJSON();
    expect(body).toHaveProperty('status', 'flows_approved');
  });
});
