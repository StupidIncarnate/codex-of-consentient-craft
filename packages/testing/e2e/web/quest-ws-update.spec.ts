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
  queueClaudeResponse,
  clearClaudeQueue,
  SimpleTextResponseStub,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-ws-update';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const PANEL_TIMEOUT = 15_000;
const CHAT_TIMEOUT = 15_000;

/**
 * Writes a quest.json with NO content (empty flows/designDecisions)
 * so the spec panel shows "Awaiting quest activity..." even though the quest exists.
 */
const createEmptyQuestFile = ({
  guildId,
  questId,
  sessionId,
}: {
  guildId: string;
  questId: string;
  sessionId: string;
}): void => {
  const homeDir = os.homedir();
  const questFolder = '001-e2e-ws-update';
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E WS Update Quest',
    status: 'created',
    createdAt: new Date().toISOString(),
    workItems: [{ id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete', spawnerType: 'agent', sessionId, createdAt: new Date().toISOString(), relatedDataItems: [], dependsOn: [] }],
    userRequest: 'Build the feature',
    designDecisions: [],
    steps: [],
    toolingRequirements: [],
    contracts: [],
    flows: [],
  };

  writeFileSync(path.join(questDir, 'quest.json'), JSON.stringify(quest, null, JSON_INDENT));
};

test.describe('Quest WS Update', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('spec panel appears via WebSocket when quest gains content after page load', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'WS Update Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-ws-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build the feature',
    });

    const questId = crypto.randomUUID();
    createEmptyQuestFile({ guildId, questId, sessionId });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    const sessionResponsePromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await sessionResponsePromise;

    // Quest exists but has no content — spec panel shows immediately with empty quest data
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // PATCH the quest to add a flow — this triggers quest-modified WS broadcast
    await request.patch(`/api/quests/${questId}`, {
      data: {
        flows: [
          {
            id: 'ws-live-flow',
            name: 'WS Live Flow',
            entryPoint: 'Start',
            exitPoints: ['End'],
            nodes: [],
            edges: [],
          },
        ],
      },
    });

    // Flow should appear via WS without page refresh
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });

  test('spec panel updates with new flows added via WS after initial render', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'WS Incremental Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-ws-inc-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build the feature',
    });

    // Create quest with one flow so the spec panel renders immediately
    const questId = crypto.randomUUID();
    const homeDir = os.homedir();
    const questFolder = '001-e2e-ws-incremental';
    const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
    mkdirSync(questDir, { recursive: true });

    const quest = {
      id: questId,
      folder: questFolder,
      title: 'E2E WS Incremental Quest',
      status: 'approved',
      createdAt: new Date().toISOString(),
      workItems: [{ id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete', spawnerType: 'agent', sessionId, createdAt: new Date().toISOString(), relatedDataItems: [], dependsOn: [] }],
      userRequest: 'Build the feature',
      designDecisions: [],
      steps: [],
      toolingRequirements: [],
      contracts: [],
      flows: [
        {
          id: 'initial-flow',
          name: 'Initial Flow',
          entryPoint: 'Start',
          exitPoints: ['End'],
          nodes: [],
          edges: [],
        },
      ],
    };
    writeFileSync(path.join(questDir, 'quest.json'), JSON.stringify(quest, null, JSON_INDENT));

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    const sessionResponsePromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await sessionResponsePromise;

    // Spec panel should be visible with the initial flow
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByText('Initial Flow')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // PATCH the quest to add a second flow via WS broadcast
    await request.patch(`/api/quests/${questId}`, {
      data: {
        flows: [
          {
            id: 'live-ws-flow',
            name: 'Live WS Flow',
            entryPoint: 'Begin',
            exitPoints: ['Finish'],
            nodes: [],
            edges: [],
          },
        ],
      },
    });

    // The new flow should appear via WS update without page refresh
    await expect(page.getByText('Live WS Flow')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });

  test('spec panel appears when quest is linked mid-chat via quest-session-linked WS event', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Quest Link Race Guild',
      path: GUILD_PATH,
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    // Queue a Claude response for the new-session flow.
    // The sessionId must be unique; the fake CLI writes a JSONL file using it.
    const sessionId = `e2e-session-link-race-${Date.now()}`;
    queueClaudeResponse(SimpleTextResponseStub({ sessionId, text: 'Quest created successfully' }));

    // Navigate to the guild session page WITHOUT a sessionId — this is a new chat
    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session`);
    await guildsResponsePromise;

    // Initially there's no quest, so we should see the awaiting placeholder
    await expect(page.getByText('Awaiting quest activity...')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Send a message — this triggers the /api/sessions/new endpoint which:
    // 1. Creates a quest via questAddBroker (empty, no flows)
    // 2. Emits quest-session-linked WS event with chatProcessId
    // 3. Spawns fake CLI
    // 4. Returns { chatProcessId } in HTTP response
    // The race condition: quest-session-linked arrives BEFORE chatProcessId is set on the client
    await page.getByTestId('CHAT_INPUT').fill('Build a login feature');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for the chat response to stream through (confirms fake CLI ran)
    await expect(page.getByText('Quest created successfully')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // The server created a quest during the chat flow. Find it via the API
    // so we can PATCH it with flows.
    const guildId = String(guild.id);
    const questsResponse = await request.get(`/api/quests?guildId=${guildId}`);
    const quests = await questsResponse.json();
    const createdQuest = quests[0];
    const questId = String(createdQuest.id);

    // PATCH the quest to add a flow and advance status — this triggers quest-modified WS broadcast.
    // If quest-session-linked was handled correctly, the client knows the questId and
    // useQuestEventsBinding is subscribed to updates for it.
    await request.patch(`/api/quests/${questId}`, {
      data: {
        status: 'explore_flows',
        flows: [
          {
            id: 'race-condition-flow',
            name: 'Race Condition Flow',
            entryPoint: 'Start',
            exitPoints: ['End'],
            nodes: [],
            edges: [],
          },
        ],
      },
    });

    // If the fix works: quest-session-linked was buffered and replayed when chatProcessId arrived,
    // so linkedQuestId is set, useQuestEventsBinding received quest-modified, spec panel shows.
    // If the bug is present: quest-session-linked was dropped, linkedQuestId is null,
    // useQuestEventsBinding ignores quest-modified, spec panel stays stuck on "Awaiting..."
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByText('Awaiting quest activity...')).not.toBeVisible();
    await expect(page.getByText('Race Condition Flow')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
  });
});
