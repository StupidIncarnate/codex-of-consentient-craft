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

const GUILD_PATH = '/tmp/dm-e2e-session-id-routing';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const PANEL_TIMEOUT = 10_000;
const STREAMING_TEXT_TIMEOUT = 10_000;

/**
 * Roles visible in the execution panel UI, mapped to their dungeon floor names.
 */
const ROLE_FLOOR_MAP: Record<string, string> = {
  chaoswhisperer: 'SANCTUM',
  pathseeker: 'CARTOGRAPHY',
  codeweaver: 'FORGE',
  ward: 'GAUNTLET',
  siegemaster: 'ARENA',
  lawbringer: 'TRIBUNAL',
};

const VISIBLE_ROLES = Object.keys(ROLE_FLOOR_MAP);

/**
 * Creates a quest.json with given work items and status.
 * Uses 001- prefixed folder so questListBroker's isQuestFolderGuard allows it.
 */
const createQuestFile = ({
  guildId,
  questId,
  sessionId,
  status,
  workItems,
  questFolder = '001-e2e-session-routing',
}: {
  guildId: string;
  questId: string;
  sessionId: string;
  status: string;
  workItems: Array<{
    id: string;
    role: string;
    sessionId: string;
    status?: string;
  }>;
  questFolder?: string;
}): void => {
  const homeDir = os.homedir();
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Session Routing Quest',
    status,
    createdAt: new Date().toISOString(),
    workItems: workItems.map((wi) => ({
      id: wi.id,
      role: wi.role,
      status: wi.status ?? 'complete',
      spawnerType: 'agent',
      sessionId: wi.sessionId,
      createdAt: new Date().toISOString(),
      relatedDataItems: [],
      dependsOn: [],
    })),
    userRequest: 'Build the feature',
    designDecisions: [],
    steps: [],
    toolingRequirements: [],
    contracts: [],
    flows: [
      {
        id: 'routing-flow',
        name: 'Session Routing Flow',
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
  const guildsResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
  );
  await page.goto(`/${urlSlug}/session/${sessionId}`);
  await guildsResponsePromise;
};

test.describe('Session ID Routing', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test.describe('per-role work item rendering in execution panel', () => {
    for (const role of VISIBLE_ROLES) {
      test(`${role} work item renders in correct floor with role badge`, async ({
        page,
        request,
      }) => {
        const guild = await createGuild(request, {
          name: `Role ${role} Guild`,
          path: GUILD_PATH,
        });
        const guildId = String(guild.id);
        const mainSessionId = `e2e-role-${role}-${Date.now()}`;

        createSessionFile({
          guildPath: GUILD_PATH,
          sessionId: mainSessionId,
          userMessage: 'Build the feature',
        });

        const questId = crypto.randomUUID();
        const workItems = [
          {
            id: crypto.randomUUID(),
            role: 'chaoswhisperer',
            sessionId: mainSessionId,
          },
          ...(role === 'chaoswhisperer'
            ? []
            : [
                {
                  id: crypto.randomUUID(),
                  role,
                  sessionId: `wi-${role}-${Date.now()}`,
                },
              ]),
        ];

        createQuestFile({
          guildId,
          questId,
          sessionId: mainSessionId,
          status: 'complete',
          workItems,
        });

        const urlSlug = String(guild.urlSlug ?? guild.name)
          .toLowerCase()
          .replace(/\s+/gu, '-');
        await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

        // Execution panel should appear (complete status is an execution phase)
        await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
          timeout: PANEL_TIMEOUT,
        });

        // The floor header for this role should be visible
        const floorName = ROLE_FLOOR_MAP[role];
        await expect(page.getByText(floorName)).toBeVisible({ timeout: PANEL_TIMEOUT });

        // The role badge should appear in an execution row
        await expect(
          page
            .getByTestId('execution-row-role-badge')
            .filter({ hasText: `[${role.toUpperCase()}]` }),
        ).toBeVisible({ timeout: PANEL_TIMEOUT });
      });
    }
  });

  test('pathseeker live streaming routes text to pathseeker panel via sessionId', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Streaming Route Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const mainSessionId = `e2e-stream-route-${Date.now()}`;

    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId: mainSessionId,
      userMessage: 'Build the feature',
    });

    const questId = crypto.randomUUID();

    // Create quest with in_progress status and only chaoswhisperer complete.
    // The orchestator will auto-create and run a pathseeker.
    createQuestFile({
      guildId,
      questId,
      sessionId: mainSessionId,
      status: 'in_progress',
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
        },
      ],
    });

    // Queue a response for the pathseeker agent
    const pathseekerText = `Pathseeker routing verification ${Date.now()}`;
    const response = SimpleTextResponseStub({ text: pathseekerText });
    response.delayMs = 500;
    queueClaudeResponse(response);

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

    // Execution panel should appear
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // The planning row should appear (pathseeker is running)
    await expect(page.getByText('Planning steps...')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The [PATHSEEKER] role badge should be visible
    await expect(
      page.getByTestId('execution-row-role-badge').filter({ hasText: '[PATHSEEKER]' }),
    ).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The streamed text should appear in the pathseeker row
    // This verifies sessionId routing: the chat-output event includes sessionId
    // and the widget routes it to the correct work item panel
    await expect(page.getByText(pathseekerText)).toBeVisible({
      timeout: STREAMING_TEXT_TIMEOUT,
    });
  });

  test('multi-instance same-role: two codeweaver work items render as separate rows', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Multi Instance Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const mainSessionId = `e2e-multi-${Date.now()}`;

    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId: mainSessionId,
      userMessage: 'Build the feature',
    });

    const questId = crypto.randomUUID();
    const cwSessionId1 = `e2e-cw1-${Date.now()}`;
    const cwSessionId2 = `e2e-cw2-${Date.now()}`;

    createQuestFile({
      guildId,
      questId,
      sessionId: mainSessionId,
      status: 'complete',
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
        },
        {
          id: crypto.randomUUID(),
          role: 'codeweaver',
          sessionId: cwSessionId1,
        },
        {
          id: crypto.randomUUID(),
          role: 'codeweaver',
          sessionId: cwSessionId2,
        },
      ],
      questFolder: '002-e2e-multi-instance',
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

    // Execution panel should appear
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // FORGE floor header should appear for codeweaver
    await expect(page.getByText('FORGE')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Two codeweaver rows should exist with distinct labels
    // The execution panel names them "Codeweaver #1" and "Codeweaver #2"
    const cwBadges = page
      .getByTestId('execution-row-role-badge')
      .filter({ hasText: '[CODEWEAVER]' });
    await expect(cwBadges).toHaveCount(2, { timeout: PANEL_TIMEOUT });

    // Each row should have a distinct session — verify by expanding both
    // and checking they are separate expandable rows
    const cwRows = page.getByTestId('execution-row-layer-widget').filter({
      has: page.getByTestId('execution-row-role-badge').filter({ hasText: '[CODEWEAVER]' }),
    });
    await expect(cwRows).toHaveCount(2);

    // Click first row header to expand it
    await cwRows.nth(0).getByTestId('execution-row-header').click();
    await expect(cwRows.nth(0).getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Click second row header to expand it
    await cwRows.nth(1).getByTestId('execution-row-header').click();
    await expect(cwRows.nth(1).getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
  });

  test('multi-instance same-role: each codeweaver instance labeled distinctly', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Multi Label Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const mainSessionId = `e2e-multi-label-${Date.now()}`;

    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId: mainSessionId,
      userMessage: 'Build the feature',
    });

    const questId = crypto.randomUUID();

    createQuestFile({
      guildId,
      questId,
      sessionId: mainSessionId,
      status: 'complete',
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
        },
        {
          id: crypto.randomUUID(),
          role: 'codeweaver',
          sessionId: `e2e-cw-a-${Date.now()}`,
        },
        {
          id: crypto.randomUUID(),
          role: 'codeweaver',
          sessionId: `e2e-cw-b-${Date.now()}`,
        },
      ],
      questFolder: '003-e2e-multi-label',
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

    // Execution panel should appear
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Verify "Codeweaver #1" and "Codeweaver #2" labels exist in the panel
    await expect(page.getByText('Codeweaver #1')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByText('Codeweaver #2')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Both should share the same FORGE floor
    await expect(page.getByText('FORGE')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Both should have [CODEWEAVER] badges
    const cwBadges = page
      .getByTestId('execution-row-role-badge')
      .filter({ hasText: '[CODEWEAVER]' });
    await expect(cwBadges).toHaveCount(2, { timeout: PANEL_TIMEOUT });
  });
});
