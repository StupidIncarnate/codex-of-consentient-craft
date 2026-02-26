import * as crypto from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createSessionFile,
  createMultiEntrySessionFile,
  cleanSessionDirectory,
  queueClaudeResponse,
  clearClaudeQueue,
  ClarificationResponseStub,
  SimpleTextResponseStub,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-dual-panel';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const CHAT_TIMEOUT = 15_000;
const PANEL_TIMEOUT = 10_000;

/**
 * Writes a quest.json to disk with requirements populated so the spec panel renders.
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
  const questFolder = '001-e2e-dual-panel';
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Dual Panel Quest',
    status: 'approved',
    createdAt: new Date().toISOString(),
    questCreatedSessionBy: sessionId,
    requirements: [
      {
        id: crypto.randomUUID(),
        name: 'Dual Panel Requirement',
        description: 'A requirement for dual-panel e2e testing',
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

/**
 * Writes a quest.json with requirements AND flows so the spec panel renders
 * during history replay tests. Uses a 002- prefixed folder to avoid collisions.
 */
const createQuestFileWithFlows = ({
  guildId,
  questId,
  sessionId,
}: {
  guildId: string;
  questId: string;
  sessionId: string;
}): void => {
  const homeDir = os.homedir();
  const questFolder = '002-e2e-dual-panel-history';
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Dual Panel History Quest',
    status: 'approved',
    createdAt: new Date().toISOString(),
    questCreatedSessionBy: sessionId,
    requirements: [
      {
        id: crypto.randomUUID(),
        name: 'History Replay Requirement',
        description: 'A requirement for history replay e2e testing',
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
    flows: [
      {
        id: crypto.randomUUID(),
        name: 'Main Flow',
        diagram: 'User -> System -> Database',
        entryPoint: 'User request',
        exitPoints: ['Success response'],
        requirementIds: [],
      },
    ],
  };

  writeFileSync(path.join(questDir, 'quest.json'), JSON.stringify(quest, null, JSON_INDENT));
};

/**
 * Builds the JSONL lines for a session history that contains
 * a fully answered clarification question exchange.
 */
const buildAnsweredClarificationHistory = () => {
  const toolUseId = 'toolu_e2e_clarify_history';

  return [
    JSON.stringify({
      type: 'user',
      message: { role: 'user', content: 'Build the quest feature' },
    }),
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: "I'll analyze the requirements for this feature." }],
      },
    }),
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          {
            type: 'tool_use',
            id: toolUseId,
            name: 'mcp__dungeonmaster__ask-user-question',
            input: {
              questions: [
                {
                  question: 'Which database do you want to use?',
                  header: 'Database Selection',
                  options: [
                    { label: 'PostgreSQL', description: 'Relational database with JSONB support' },
                    { label: 'SQLite', description: 'Lightweight file-based database' },
                  ],
                  multiSelect: false,
                },
              ],
            },
          },
        ],
      },
    }),
    JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseId,
            content: 'Questions sent to user. Their answers will arrive as your next user message.',
          },
        ],
      },
    }),
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: "I'll wait for your response before proceeding." }],
      },
    }),
    JSON.stringify({
      type: 'user',
      message: { role: 'user', content: 'Database Selection: PostgreSQL' },
    }),
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          {
            type: 'text',
            text: 'Great choice! Phase 1: Setting up PostgreSQL schema. Phase 2: Creating migrations. Phase 3: Wiring up the broker layer.',
          },
        ],
      },
    }),
  ];
};

test.describe('Quest Dual Panel', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('clarify panel and spec panel are visible simultaneously after ask-user-question tool use', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Dual Panel Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build the login feature',
    });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId });

    // Queue a clarification response that triggers the clarify panel
    queueClaudeResponse(ClarificationResponseStub({ sessionId }));

    // Navigate to the session page and wait for data to load
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    // Send a message to trigger the queued clarification response
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    // Both panels should be visible simultaneously
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Verify question text is visible
    await expect(page.getByTestId('CLARIFY_QUESTION_TEXT')).toBeVisible();
    await expect(page.getByTestId('CLARIFY_QUESTION_TEXT')).toContainText(
      'Which database do you want to use?',
    );

    // Verify options are visible and clickable
    const options = page.getByTestId('CLARIFY_OPTION');
    await expect(options.first()).toBeVisible();
    await expect(options.first()).toContainText('PostgreSQL');

    // Click an option to answer the question
    await options.first().click();

    // After answering, clarify panel should disappear while spec panel remains
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible();
  });

  test('clarify panel disappears after answering and does not reappear during continued chat', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Dual Panel Stale Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-stale-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build the login feature',
    });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId });

    // Queue TWO responses:
    // 1. Clarification question
    // 2. Continuation text after the user answers
    queueClaudeResponse(ClarificationResponseStub({ sessionId }));
    queueClaudeResponse(
      SimpleTextResponseStub({ sessionId, text: 'Phase 1: Setting up database schema' }),
    );

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    // Send a message to trigger the clarification
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for clarify panel to appear
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Click the first option to answer the question
    const options = page.getByTestId('CLARIFY_OPTION');
    await options.first().click();

    // Clarify panel should disappear after answering
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Wait for the continuation response to stream through
    await expect(page.getByText('Phase 1: Setting up database schema')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Bug A: clarify panel should STILL not be visible after continuation streams
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible();

    // Spec panel should be visible throughout
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible();
  });

  test('spec panel loads quest data on initial page load without sending a message', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Dual Panel Load Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-load-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build the feature',
    });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId });

    // Do NOT queue any claude responses — this test validates initial load only

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    // Bug B: spec panel should load quest data via WebSocket without user interaction
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The "Awaiting quest activity..." placeholder should NOT be visible
    await expect(page.getByText('Awaiting quest activity...')).not.toBeVisible();

    // Quest requirement name should be visible in the spec panel
    await expect(page.getByText('Dual Panel Requirement')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });

  test('history replay of session with answered clarification does not show clarify panel', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Dual Panel History Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-history-${Date.now()}`;
    const historyLines = buildAnsweredClarificationHistory();
    createMultiEntrySessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      lines: historyLines,
    });

    const questId = crypto.randomUUID();
    createQuestFileWithFlows({ guildId, questId, sessionId });

    // Do NOT queue any claude responses — this is pure history replay

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    // Wait for history to fully replay — the Phase 1 text from the final assistant entry
    await expect(page.getByText('Phase 1: Setting up PostgreSQL schema.')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Bug A: clarify panel must NOT be visible — the question was already answered in history
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible();

    // Spec panel should be visible since the quest has requirements and flows
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });

  test('page reload after answering clarification preserves spec panel and hides clarify panel', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Dual Panel Reload Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-dual-reload-${Date.now()}`;
    const historyLines = buildAnsweredClarificationHistory();
    createMultiEntrySessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      lines: historyLines,
    });

    const questId = crypto.randomUUID();
    createQuestFileWithFlows({ guildId, questId, sessionId });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    // Wait for initial history load
    await expect(page.getByText('Phase 1: Setting up PostgreSQL schema.')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Verify initial state is correct
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible();
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Reload the page to test re-navigation timing
    await page.reload();
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    // Wait for history to replay again after reload
    await expect(page.getByText('Phase 1: Setting up PostgreSQL schema.')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // After reload, clarify panel should still not appear
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible();

    // Spec panel should still be visible after reload
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });
});
