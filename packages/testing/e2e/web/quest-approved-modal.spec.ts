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

const GUILD_PATH = '/tmp/dm-e2e-quest-approved-modal';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const MODAL_TIMEOUT = 10_000;
const PANEL_TIMEOUT = 15_000;
const REQUEST_TIMEOUT = 5000;
const WS_PROPAGATION_DELAY = 2000;

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
  const questFolder = '001-e2e-approved-modal';
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Approved Modal Quest',
    status,
    createdAt: new Date().toISOString(),
    workItems: [{ id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete', spawnerType: 'agent', sessionId, createdAt: new Date().toISOString(), relatedDataItems: [], dependsOn: [] }],
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

test.describe('Quest Approved Modal', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('modal appears when quest transitions to approved status via WS', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Approved Modal Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-approved-modal-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build the feature' });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId, status: 'review_observables' });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // PATCH quest to approved — triggers quest-modified WS broadcast
    await patchQuestStatus({ request, questId, status: 'approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
    await expect(page.getByText('Begin Quest')).toBeVisible();
    await expect(page.getByText('Keep Chatting')).toBeVisible();
    await expect(page.getByText('Start a new Quest')).toBeVisible();
  });

  test('modal appears when quest transitions to design_approved status via WS', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Design Approved Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-design-approved-${Date.now()}`;
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
  });

  test('clicking Begin Quest sends POST to quest start endpoint', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Begin Quest Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-begin-quest-${Date.now()}`;
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

    // Intercept the POST request to verify it was made
    const startRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByText('Begin Quest').click();

    const startRequest = await startRequestPromise;
    expect(startRequest.method()).toBe('POST');

    // Modal should close after clicking
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
  });

  test('clicking Keep Chatting sends PATCH to revert quest to review status', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Keep Chatting Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-keep-chatting-${Date.now()}`;
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

    // Intercept the PATCH to verify it reverts to review_observables
    const patchPromise = page.waitForRequest(
      (req) => req.method() === 'PATCH' && req.url().includes(`/api/quests/${questId}`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByText('Keep Chatting').click();

    const patchRequest = await patchPromise;
    const body = patchRequest.postDataJSON();
    expect(body).toHaveProperty('status', 'review_observables');

    // Modal should close
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Spec panel should remain visible (still in review)
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible();
  });

  test('clicking Keep Chatting on design_approved reverts to explore_design', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Keep Chatting Design Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-keep-design-${Date.now()}`;
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

    await page.getByText('Keep Chatting').click();

    const patchRequest = await patchPromise;
    const body = patchRequest.postDataJSON();
    expect(body).toHaveProperty('status', 'explore_design');
  });

  test('clicking Start a new Quest navigates to /:guildSlug/session', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'New Quest Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-new-quest-${Date.now()}`;
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

    await page.getByText('Start a new Quest').click();

    // Should navigate to the guild session page (no sessionId)
    await page.waitForURL(`**/${urlSlug}/session`, { timeout: REQUEST_TIMEOUT });
    expect(page.url()).toContain(`/${urlSlug}/session`);
    expect(page.url()).not.toContain(sessionId);
  });

  test('modal does not appear for non-approved status transitions', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'No Modal Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-no-modal-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build the feature' });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId, status: 'review_flows' });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Transition to flows_approved (not approved or design_approved)
    await patchQuestStatus({ request, questId, status: 'flows_approved' });

    // Wait for any WS events to propagate
    await page.waitForTimeout(WS_PROPAGATION_DELAY);

    // Modal should NOT appear
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible();
  });

  test('Begin Quest transitions to execution view when quest reaches in_progress', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Execution View Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-execution-${Date.now()}`;
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

    await page.getByText('Begin Quest').click();

    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Execution panel and dumpster raccoon should appear
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('dumpster-raccoon-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
  });
});
