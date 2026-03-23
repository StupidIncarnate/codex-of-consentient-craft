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
  clearClaudeQueue,
  queueWardResponse,
  clearWardQueue,
} from './fixtures/test-helpers';
import { DelayMillisecondsStub } from '../../src/contracts/delay-milliseconds/delay-milliseconds.stub';

const GUILD_PATH = '/tmp/dm-e2e-ward-execution-streaming';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const PANEL_TIMEOUT = 10_000;
const WARD_OUTPUT_TIMEOUT = 15_000;
const TEST_TIMEOUT = 30_000;

const createWardQuestFile = ({
  guildId,
  questId,
  sessionId,
  wardType,
}: {
  guildId: string;
  questId: string;
  sessionId: string;
  wardType: 'mini-boss' | 'floor-boss';
}): void => {
  const homeDir = os.homedir();
  const questFolder = `001-e2e-ward-${wardType}`;
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const chaoswhispererId = 'e2e00000-0000-4000-8000-000000000001';
  const pathseekerId = 'e2e00000-0000-4000-8000-000000000002';
  const codeweaver1Id = 'e2e00000-0000-4000-8000-000000000003';
  const wardMiniBossId = 'e2e00000-0000-4000-8000-000000000004';
  const siegemasterId = 'e2e00000-0000-4000-8000-000000000005';
  const lawbringerId = 'e2e00000-0000-4000-8000-000000000006';
  const wardFloorBossId = 'e2e00000-0000-4000-8000-000000000007';

  const now = new Date().toISOString();

  const baseWorkItems = [
    {
      id: chaoswhispererId,
      role: 'chaoswhisperer',
      status: 'complete',
      spawnerType: 'agent',
      sessionId,
      createdAt: now,
      relatedDataItems: [],
      dependsOn: [],
      completedAt: now,
    },
    {
      id: pathseekerId,
      role: 'pathseeker',
      status: 'complete',
      spawnerType: 'agent',
      sessionId: `ps-${sessionId}`,
      createdAt: now,
      relatedDataItems: [],
      dependsOn: [chaoswhispererId],
      completedAt: now,
    },
    {
      id: codeweaver1Id,
      role: 'codeweaver',
      status: 'complete',
      spawnerType: 'agent',
      sessionId: `cw-${sessionId}`,
      createdAt: now,
      relatedDataItems: [],
      dependsOn: [pathseekerId],
      completedAt: now,
    },
    {
      id: wardMiniBossId,
      role: 'ward',
      status: wardType === 'mini-boss' ? 'pending' : 'complete',
      spawnerType: 'command',
      createdAt: now,
      relatedDataItems: [],
      dependsOn: [codeweaver1Id],
      attempt: 0,
      maxAttempts: 3,
      ...(wardType === 'mini-boss' ? {} : { completedAt: now }),
    },
  ];

  const additionalItems =
    wardType === 'floor-boss'
      ? [
          {
            id: siegemasterId,
            role: 'siegemaster',
            status: 'complete',
            spawnerType: 'agent',
            sessionId: `siege-${sessionId}`,
            createdAt: now,
            relatedDataItems: [],
            dependsOn: [wardMiniBossId],
            completedAt: now,
          },
          {
            id: lawbringerId,
            role: 'lawbringer',
            status: 'complete',
            spawnerType: 'agent',
            sessionId: `lb-${sessionId}`,
            createdAt: now,
            relatedDataItems: [],
            dependsOn: [siegemasterId],
            completedAt: now,
          },
          {
            id: wardFloorBossId,
            role: 'ward',
            status: 'pending',
            spawnerType: 'command',
            createdAt: now,
            relatedDataItems: [],
            dependsOn: [lawbringerId],
            attempt: 0,
            maxAttempts: 3,
          },
        ]
      : [];

  const quest = {
    id: questId,
    folder: questFolder,
    title: `E2E Ward ${wardType} Streaming`,
    status: 'in_progress',
    createdAt: now,
    workItems: [...baseWorkItems, ...additionalItems],
    userRequest: 'Test ward streaming',
    designDecisions: [],
    steps: [
      {
        id: 'implement-feature',
        name: 'Implement feature',
        description: 'Build the feature',
        observablesSatisfied: [],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
      },
    ],
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
  const guildsResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
  );
  await page.goto(`/${urlSlug}/session/${sessionId}`);
  await guildsResponsePromise;
};

test.describe('Ward Execution Streaming', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    clearWardQueue();
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('mini boss ward streams output lines to execution panel', async ({ page, request }) => {
    test.setTimeout(TEST_TIMEOUT);

    const guild = await createGuild(request, {
      name: 'Ward Mini Boss Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-ward-mini-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Test ward streaming' });

    const questId = crypto.randomUUID();
    createWardQuestFile({ guildId, questId, sessionId, wardType: 'mini-boss' });

    // Queue ward response with output lines that should stream to the frontend.
    // delayMs gives the browser time to process the quest-modified event (wardSessionId storage)
    // and reconnect its WS listener before ward output lines are broadcast.
    queueWardResponse({
      exitCode: 0,
      runId: 'e2e-mini-boss-run-001',
      delayMs: DelayMillisecondsStub({ value: 500 }),
      outputLines: [
        'lint        @dungeonmaster/shared PASS  42 files',
        'typecheck   @dungeonmaster/shared PASS',
        'unit        @dungeonmaster/shared PASS  15 tests passed',
      ],
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    // Navigate — quest is already in_progress so execution panel + WS listener activate immediately.
    // The widget auto-starts the orchestration loop, which picks up the pending ward.
    // Because the WS listener is set up BEFORE the HTTP POST reaches the server,
    // ward output lines arrive on an already-connected socket.
    await navigateToSession({ page, urlSlug, sessionId });

    // Execution panel renders immediately since quest is in_progress
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Wait for ward row to appear with DONE status
    const wardRow = page.getByText('[WARD]').first();
    await expect(wardRow).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });

    // Click the ward row to expand it and reveal streamed entries
    await wardRow.click();

    // Ward output lines should be visible in the expanded row after streaming
    await expect(page.getByText('lint        @dungeonmaster/shared PASS  42 files')).toBeVisible({
      timeout: WARD_OUTPUT_TIMEOUT,
    });
    await expect(
      page.getByText('unit        @dungeonmaster/shared PASS  15 tests passed'),
    ).toBeVisible({
      timeout: WARD_OUTPUT_TIMEOUT,
    });
  });

  test('floor boss ward streams output lines to execution panel', async ({ page, request }) => {
    test.setTimeout(TEST_TIMEOUT);

    const guild = await createGuild(request, {
      name: 'Ward Floor Boss Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-ward-floor-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Test ward streaming' });

    const questId = crypto.randomUUID();
    createWardQuestFile({ guildId, questId, sessionId, wardType: 'floor-boss' });

    // Queue ward response with output lines for the floor boss ward.
    // delayMs gives the browser time to process the quest-modified event (wardSessionId storage)
    // and reconnect its WS listener before ward output lines are broadcast.
    queueWardResponse({
      exitCode: 0,
      runId: 'e2e-floor-boss-run-001',
      delayMs: DelayMillisecondsStub({ value: 500 }),
      outputLines: [
        'lint        @dungeonmaster/orchestrator PASS  128 files',
        'typecheck   @dungeonmaster/orchestrator PASS',
        'unit        @dungeonmaster/orchestrator PASS  87 tests passed',
        'integration @dungeonmaster/orchestrator PASS  12 tests passed',
      ],
    });

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    // Navigate — quest is already in_progress so execution panel + WS listener activate immediately.
    // The widget auto-starts the orchestration loop, which picks up the pending ward.
    await navigateToSession({ page, urlSlug, sessionId });

    // Execution panel renders immediately since quest is in_progress
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Wait for floor boss ward row — find the last [WARD] badge
    const wardRows = page.getByText('[WARD]');
    await expect(wardRows.last()).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });

    // Click the floor boss ward row to expand it
    await wardRows.last().click();

    // Ward output lines should be visible in the expanded row after streaming
    await expect(
      page.getByText('lint        @dungeonmaster/orchestrator PASS  128 files'),
    ).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });
    await expect(
      page.getByText('integration @dungeonmaster/orchestrator PASS  12 tests passed'),
    ).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });
  });
});
