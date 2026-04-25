import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { wardMockHarness } from '../../test/harnesses/ward-mock/ward-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { DelayMillisecondsStub } from '../../src/contracts/delay-milliseconds/delay-milliseconds.stub';

const GUILD_PATH = '/tmp/dm-e2e-ward-execution-streaming';
const HTTP_OK = 200;
const PANEL_TIMEOUT = 10_000;
const WARD_OUTPUT_TIMEOUT = 15_000;

wireHarnessLifecycle({ harness: claudeMockHarness({ guildPath: GUILD_PATH }), testObj: test });
const wardMock = wireHarnessLifecycle({
  harness: wardMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Ward Execution Streaming', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: mini boss ward streams output lines to execution panel', async ({
    page,
    request,
  }) => {
    test.slow();

    const guild = await guildHarness({ request }).createGuild({
      name: 'Ward Mini Boss Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-ward-mini-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Test ward streaming' });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Ward mini-boss Streaming',
      userRequest: 'Test ward streaming',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    const chaoswhispererId = 'e2e00000-0000-4000-8000-000000000001';
    const pathseekerId = 'e2e00000-0000-4000-8000-000000000002';
    const codeweaver1Id = 'e2e00000-0000-4000-8000-000000000003';
    const wardMiniBossId = 'e2e00000-0000-4000-8000-000000000004';
    const now = new Date().toISOString();

    // Seed quest with approved status + prior work items complete + pending ward.
    // POST /start transitions the quest to seek_scope and kicks the orchestration loop,
    // which skips the already-complete pathseeker and picks up the pending ward directly.
    const quests = questHarness({ request });
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      title: 'E2E Ward mini-boss Streaming',
      status: 'approved',
      userRequest: 'Test ward streaming',
      workItems: [
        {
          id: chaoswhispererId,
          role: 'chaoswhisperer',
          status: 'complete',
          spawnerType: 'agent',
          sessionId,
          createdAt: now,
          completedAt: now,
        },
        {
          id: pathseekerId,
          role: 'pathseeker',
          status: 'complete',
          spawnerType: 'agent',
          sessionId: `ps-${sessionId}`,
          dependsOn: [chaoswhispererId],
          createdAt: now,
          completedAt: now,
        },
        {
          id: codeweaver1Id,
          role: 'codeweaver',
          status: 'complete',
          spawnerType: 'agent',
          sessionId: `cw-${sessionId}`,
          dependsOn: [pathseekerId],
          createdAt: now,
          completedAt: now,
        },
        {
          id: wardMiniBossId,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          createdAt: now,
          dependsOn: [codeweaver1Id],
          attempt: 0,
          maxAttempts: 3,
        },
      ],
      steps: [{ id: 'implement-feature', name: 'Implement feature' }],
    });

    // Queue ward response with output lines that should stream to the frontend.
    // delayMs gives the browser time to process the quest-modified event (wardSessionId storage)
    // and reconnect its WS listener before ward output lines are broadcast.
    wardMock.queueResponse({
      response: {
        exitCode: 0,
        runId: 'e2e-mini-boss-run-001',
        delayMs: DelayMillisecondsStub({ value: 500 }),
        outputLines: [
          'lint        @dungeonmaster/shared PASS  42 files',
          'typecheck   @dungeonmaster/shared PASS',
          'unit        @dungeonmaster/shared PASS  15 tests passed',
        ],
      },
    });

    // Kick orchestration off before navigation so the quest is already in an
    // execution-phase status (seek_scope) by the time the browser renders —
    // the WS execution listener activates on first paint and no ward output is lost.
    await request.post(`/api/quests/${questId}/start`);

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await guildsResponsePromise;

    // Execution panel renders immediately since quest status is seek_scope
    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Wait for ward row to appear with DONE status
    const wardRow = executionPanel.getByText('[WARD]').first();

    await expect(wardRow).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });

    // Click the ward row to expand it and reveal streamed entries
    await wardRow.click();

    // Ward output lines should be visible in the expanded row after streaming.
    // Scope to the execution panel because the activity panel also flattens session entries and
    // renders the same text, which would otherwise trip Playwright's strict-mode duplicate match.
    await expect(
      executionPanel.getByText('lint        @dungeonmaster/shared PASS  42 files'),
    ).toBeVisible({
      timeout: WARD_OUTPUT_TIMEOUT,
    });
    await expect(
      executionPanel.getByText('unit        @dungeonmaster/shared PASS  15 tests passed'),
    ).toBeVisible({
      timeout: WARD_OUTPUT_TIMEOUT,
    });
  });

  test('VALID: floor boss ward streams output lines to execution panel', async ({
    page,
    request,
  }) => {
    test.slow();

    const guild = await guildHarness({ request }).createGuild({
      name: 'Ward Floor Boss Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-ward-floor-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Test ward streaming' });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Ward floor-boss Streaming',
      userRequest: 'Test ward streaming',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    const chaoswhispererId = 'e2e00000-0000-4000-8000-000000000001';
    const pathseekerId = 'e2e00000-0000-4000-8000-000000000002';
    const codeweaver1Id = 'e2e00000-0000-4000-8000-000000000003';
    const wardMiniBossId = 'e2e00000-0000-4000-8000-000000000004';
    const siegemasterId = 'e2e00000-0000-4000-8000-000000000005';
    const lawbringerId = 'e2e00000-0000-4000-8000-000000000006';
    const wardFloorBossId = 'e2e00000-0000-4000-8000-000000000007';
    const now = new Date().toISOString();

    // Seed quest with approved status + full prior chain complete + pending floor-boss ward.
    // POST /start transitions to seek_scope; the loop skips the complete pathseeker and
    // other satisfied items and dispatches the ready floor-boss ward.
    const quests = questHarness({ request });
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      title: 'E2E Ward floor-boss Streaming',
      status: 'approved',
      userRequest: 'Test ward streaming',
      workItems: [
        {
          id: chaoswhispererId,
          role: 'chaoswhisperer',
          status: 'complete',
          spawnerType: 'agent',
          sessionId,
          createdAt: now,
          completedAt: now,
        },
        {
          id: pathseekerId,
          role: 'pathseeker',
          status: 'complete',
          spawnerType: 'agent',
          sessionId: `ps-${sessionId}`,
          dependsOn: [chaoswhispererId],
          createdAt: now,
          completedAt: now,
        },
        {
          id: codeweaver1Id,
          role: 'codeweaver',
          status: 'complete',
          spawnerType: 'agent',
          sessionId: `cw-${sessionId}`,
          dependsOn: [pathseekerId],
          createdAt: now,
          completedAt: now,
        },
        {
          id: wardMiniBossId,
          role: 'ward',
          status: 'complete',
          spawnerType: 'command',
          dependsOn: [codeweaver1Id],
          createdAt: now,
          completedAt: now,
          attempt: 0,
          maxAttempts: 3,
        },
        {
          id: siegemasterId,
          role: 'siegemaster',
          status: 'complete',
          spawnerType: 'agent',
          sessionId: `siege-${sessionId}`,
          dependsOn: [wardMiniBossId],
          createdAt: now,
          completedAt: now,
        },
        {
          id: lawbringerId,
          role: 'lawbringer',
          status: 'complete',
          spawnerType: 'agent',
          sessionId: `lb-${sessionId}`,
          dependsOn: [siegemasterId],
          createdAt: now,
          completedAt: now,
        },
        {
          id: wardFloorBossId,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          dependsOn: [lawbringerId],
          createdAt: now,
          attempt: 0,
          maxAttempts: 3,
        },
      ],
      steps: [{ id: 'implement-feature', name: 'Implement feature' }],
    });

    // Queue ward response with output lines for the floor boss ward.
    // delayMs gives the browser time to process the quest-modified event (wardSessionId storage)
    // and reconnect its WS listener before ward output lines are broadcast.
    wardMock.queueResponse({
      response: {
        exitCode: 0,
        runId: 'e2e-floor-boss-run-001',
        delayMs: DelayMillisecondsStub({ value: 500 }),
        outputLines: [
          'lint        @dungeonmaster/orchestrator PASS  128 files',
          'typecheck   @dungeonmaster/orchestrator PASS',
          'unit        @dungeonmaster/orchestrator PASS  87 tests passed',
          'integration @dungeonmaster/orchestrator PASS  12 tests passed',
        ],
      },
    });

    // Kick orchestration off before navigation so the widget lands on an execution-phase
    // quest with the WS execution listener active from the first render.
    await request.post(`/api/quests/${questId}/start`);

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await guildsResponsePromise;

    // Execution panel renders immediately since quest status is seek_scope
    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Wait for floor boss ward row — there should be 2 [WARD] badges (mini boss + floor boss)
    const wardRows = executionPanel.getByText('[WARD]');

    await expect(wardRows.nth(1)).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });

    // Click the floor boss ward row (second [WARD] badge) to expand it
    await wardRows.nth(1).click();

    // Ward output lines should be visible in the expanded row after streaming.
    // Scope to the execution panel because the activity panel also flattens session entries and
    // renders the same text, which would otherwise trip Playwright's strict-mode duplicate match.
    await expect(
      executionPanel.getByText('lint        @dungeonmaster/orchestrator PASS  128 files'),
    ).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });
    await expect(
      executionPanel.getByText('integration @dungeonmaster/orchestrator PASS  12 tests passed'),
    ).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });
  });
});
