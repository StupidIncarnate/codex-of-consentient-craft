import { mkdirSync, writeFileSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  createSessionFile,
  cleanSessionDirectory,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-approved-modal';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const MODAL_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 5_000;
const REQUEST_TIMEOUT = 3000;
const WS_PROPAGATION_DELAY = 2000;

const writeQuestFile = ({
  questId,
  questFolder,
  questFilePath,
  sessionId,
  status,
}: {
  questId: string;
  questFolder: string;
  questFilePath: string;
  sessionId: string;
  status: string;
}): void => {
  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Approved Modal Quest',
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

  writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));
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
  const guildsResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
  );
  await page.goto(`/${urlSlug}/session/${sessionId}`);
  await guildsResponsePromise;
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

const setupTest = async ({
  request,
  guildName,
  sessionId,
  status,
}: {
  request: Parameters<Parameters<typeof test>[2]>[0]['request'];
  guildName: string;
  sessionId: string;
  status: string;
}) => {
  const guild = await createGuild(request, { name: guildName, path: GUILD_PATH });
  const guildId = String(guild.id);
  createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build the feature' });

  const created = await createQuest(request, {
    guildId,
    title: 'E2E Approved Modal Quest',
    userRequest: 'Build the feature',
  });
  const { questId } = created;
  const questFolder = String(Reflect.get(created, 'questFolder'));
  const questFilePath = String(Reflect.get(created, 'filePath'));

  writeQuestFile({ questId, questFolder, questFilePath, sessionId, status });

  const urlSlug = String(guild.urlSlug ?? guild.name)
    .toLowerCase()
    .replace(/\s+/gu, '-');

  return { guild, questId, urlSlug };
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
    const sessionId = `e2e-approved-modal-${Date.now()}`;
    const { questId, urlSlug } = await setupTest({
      request,
      guildName: 'Approved Modal Guild',
      sessionId,
      status: 'review_observables',
    });

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
    const sessionId = `e2e-design-approved-${Date.now()}`;
    const { questId, urlSlug } = await setupTest({
      request,
      guildName: 'Design Approved Guild',
      sessionId,
      status: 'review_design',
    });

    await navigateToSession({ page, urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await patchQuestStatus({ request, questId, status: 'design_approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
  });

  test('clicking Begin Quest sends POST to quest start endpoint', async ({ page, request }) => {
    const sessionId = `e2e-begin-quest-${Date.now()}`;
    const { questId, urlSlug } = await setupTest({
      request,
      guildName: 'Begin Quest Guild',
      sessionId,
      status: 'review_observables',
    });

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
    const sessionId = `e2e-keep-chatting-${Date.now()}`;
    const { questId, urlSlug } = await setupTest({
      request,
      guildName: 'Keep Chatting Guild',
      sessionId,
      status: 'review_observables',
    });

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
    const sessionId = `e2e-keep-design-${Date.now()}`;
    const { questId, urlSlug } = await setupTest({
      request,
      guildName: 'Keep Chatting Design Guild',
      sessionId,
      status: 'review_design',
    });

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
    const sessionId = `e2e-new-quest-${Date.now()}`;
    const { questId, urlSlug } = await setupTest({
      request,
      guildName: 'New Quest Guild',
      sessionId,
      status: 'review_observables',
    });

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
    const sessionId = `e2e-no-modal-${Date.now()}`;
    const { questId, urlSlug } = await setupTest({
      request,
      guildName: 'No Modal Guild',
      sessionId,
      status: 'review_flows',
    });

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
    const sessionId = `e2e-execution-${Date.now()}`;
    const { questId, urlSlug } = await setupTest({
      request,
      guildName: 'Execution View Guild',
      sessionId,
      status: 'review_observables',
    });

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
