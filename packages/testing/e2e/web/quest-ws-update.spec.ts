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

const GUILD_PATH = '/tmp/dm-e2e-quest-ws-update';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const PANEL_TIMEOUT = 10_000;

/**
 * Writes a quest.json with NO content (empty requirements/flows/observables)
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
    questCreatedSessionBy: sessionId,
    requirements: [],
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

test.describe('Quest WS Update', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
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

    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    // Quest exists but has no content — should show the awaiting placeholder
    await expect(page.getByText('Awaiting quest activity...')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();

    // PATCH the quest to add a requirement — this triggers quest-modified WS broadcast
    const requirementId = crypto.randomUUID();
    await request.patch(`/api/quests/${questId}`, {
      data: {
        requirements: [
          {
            id: requirementId,
            name: 'WS Live Requirement',
            description: 'Requirement added after page load to test WS update',
            scope: 'packages/web',
            status: 'approved',
          },
        ],
      },
    });

    // Spec panel should appear via WS without page refresh
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByText('Awaiting quest activity...')).not.toBeVisible();
  });

  test('spec panel updates with new requirements added via WS after initial render', async ({
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

    // Create quest with one requirement so the spec panel renders immediately
    const questId = crypto.randomUUID();
    const homeDir = os.homedir();
    const questFolder = '001-e2e-ws-incremental';
    const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
    mkdirSync(questDir, { recursive: true });

    const initialRequirementId = crypto.randomUUID();
    const quest = {
      id: questId,
      folder: questFolder,
      title: 'E2E WS Incremental Quest',
      status: 'approved',
      createdAt: new Date().toISOString(),
      questCreatedSessionBy: sessionId,
      requirements: [
        {
          id: initialRequirementId,
          name: 'Initial Requirement',
          description: 'Present before page load',
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

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/guilds') && r.url().includes('/sessions') && r.status() === HTTP_OK,
    );

    // Spec panel should be visible with the initial requirement
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByText('Initial Requirement')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // PATCH the quest to add a second requirement via WS broadcast
    const secondRequirementId = crypto.randomUUID();
    await request.patch(`/api/quests/${questId}`, {
      data: {
        requirements: [
          {
            id: secondRequirementId,
            name: 'Live WS Requirement',
            description: 'Added after page load via PATCH',
            scope: 'packages/web',
            status: 'approved',
          },
        ],
      },
    });

    // The new requirement should appear via WS update without page refresh
    await expect(page.getByText('Live WS Requirement')).toBeVisible({ timeout: PANEL_TIMEOUT });
  });
});
