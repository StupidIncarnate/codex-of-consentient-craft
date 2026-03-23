import { mkdirSync, writeFileSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  createSessionFile,
  cleanSessionDirectory,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-begin-transition';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const MODAL_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 5_000;
const REQUEST_TIMEOUT = 3000;
const PATHSEEKER_TIMEOUT = 10_000;

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

    // Create quest via API to get the server-resolved file path
    const created = await createQuest(request, {
      guildId,
      title: 'E2E Begin Transition Quest',
      userRequest: 'Build the feature',
    });
    const questId = created.questId;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

    // Overwrite quest.json with desired status
    const quest = {
      id: questId,
      folder: questFolder,
      title: 'E2E Begin Transition Quest',
      status: 'review_observables',
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
    await navigateToSession({ page, urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await patchQuestStatus({ request, questId, status: 'approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Begin Quest must POST to the quest start endpoint (which creates the pathseeker
    // work item via OrchestrationStartResponder). A PATCH to the modify endpoint would
    // set status=in_progress but skip pathseeker creation — the H-1 root cause bug.
    const startPromise = page.waitForRequest(
      (req) =>
        req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByRole('button', { name: 'Begin Quest' }).click();

    const startRequest = await startPromise;
    expect(startRequest.method()).toBe('POST');
    expect(startRequest.url()).toContain(`/api/quests/${questId}/start`);

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

    // Pathseeker work item must appear in the execution panel.
    // Without this check, the test passes even if the quest goes straight
    // to complete with no pathseeker (the H-1 bug).
    await expect(page.getByText('[PATHSEEKER]')).toBeVisible({
      timeout: PATHSEEKER_TIMEOUT,
    });
  });

  test('clicking Begin Quest on design_approved sends POST to quest start endpoint', async ({
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

    // Create quest via API to get the server-resolved file path
    const created = await createQuest(request, {
      guildId,
      title: 'E2E Design Begin Quest',
      userRequest: 'Build the feature',
    });
    const questId = created.questId;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

    // Overwrite quest.json with desired status
    const quest = {
      id: questId,
      folder: questFolder,
      title: 'E2E Design Begin Quest',
      status: 'review_design',
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
    await navigateToSession({ page, urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await patchQuestStatus({ request, questId, status: 'design_approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    const startPromise = page.waitForRequest(
      (req) =>
        req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByRole('button', { name: 'Begin Quest' }).click();

    const startRequest = await startPromise;
    expect(startRequest.method()).toBe('POST');
    expect(startRequest.url()).toContain(`/api/quests/${questId}/start`);

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

    // Pathseeker work item must appear in the execution panel
    await expect(page.getByText('[PATHSEEKER]')).toBeVisible({
      timeout: PATHSEEKER_TIMEOUT,
    });
  });
});
