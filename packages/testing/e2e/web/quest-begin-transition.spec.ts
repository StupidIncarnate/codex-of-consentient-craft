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

const GUILD_PATH = '/tmp/dm-e2e-quest-begin-transition';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const MODAL_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 5_000;
const REQUEST_TIMEOUT = 3000;

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
  const questFolder = '001-e2e-begin-transition';
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Begin Transition Quest',
    status,
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

  writeFileSync(path.join(questDir, 'quest.json'), JSON.stringify(quest, null, JSON_INDENT));
};

const navigateToSession = async ({
  page,
  urlSlug,
  sessionId,
}: {
  page: Parameters<Parameters<typeof test>[2]>[0]['page'];
  urlSlug: string;
  sessionId: string;
}): Promise<void> => {
  const sessionResponsePromise = page.waitForResponse(
    (r) =>
      r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
  );
  await page.goto(`/${urlSlug}/session/${sessionId}`);
  await sessionResponsePromise;
};

const patchQuestStatus = async ({
  request,
  questId,
  status,
}: {
  request: Parameters<Parameters<typeof test>[2]>[0]['request'];
  questId: string;
  status: string;
}): Promise<void> => {
  await request.patch(`/api/quests/${questId}`, {
    data: { status },
  });
};

test.describe('Quest Begin Transition', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('clicking Begin Quest sends PATCH to transition quest status to in_progress', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Begin Transition Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-begin-transition-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build the feature' });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId, status: 'review_observables' });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await patchQuestStatus({ request, questId, status: 'approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Watch for a PATCH request that transitions status to in_progress
    const patchPromise = page.waitForRequest(
      (req) => req.method() === 'PATCH' && req.url().includes(`/api/quests/${questId}`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByText('Begin Quest').click();

    const patchRequest = await patchPromise;
    const body = patchRequest.postDataJSON();
    expect(body).toHaveProperty('status', 'in_progress');

    // Modal should close and execution view should appear
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('dumpster-raccoon-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
  });

  test('clicking Begin Quest on design_approved sends PATCH to transition to in_progress', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Design Begin Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-design-begin-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build the feature' });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId, status: 'review_design' });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await patchQuestStatus({ request, questId, status: 'design_approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    const patchPromise = page.waitForRequest(
      (req) => req.method() === 'PATCH' && req.url().includes(`/api/quests/${questId}`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByText('Begin Quest').click();

    const patchRequest = await patchPromise;
    const body = patchRequest.postDataJSON();
    expect(body).toHaveProperty('status', 'in_progress');

    // Modal should close and execution view should appear
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('dumpster-raccoon-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
  });
});
