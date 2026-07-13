import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-ward-discovery-mismatch';
const PANEL_TIMEOUT = 5_000;
const DETAIL_TIMEOUT = 5_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// Regression: a ward run can FAIL (exit 1) with EVERY check pass/skip — the failure is a discovery
// mismatch (files discovered ≠ files processed), which ward exits 1 on because an unrun test is a
// hidden regression. The reason lives only in ward's stdout + exit code; without ward stamping it
// into the detail blob the execution panel showed only "Ward exit code: 1 (changed)" / a blank
// "ward_failed". The fix: ward flags the mismatched check (`discoveryMismatch: true` + the
// only-discovered / only-processed file lists) and the panel renders a DISCOVERY MISMATCH breakdown.
test.describe('Failed ward row shows discovery-mismatch detail (all checks pass/skip)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {blocked quest, failed ward linked to a mismatch-only ward-result} => expanded WARD row shows DISCOVERY MISMATCH + discovered files', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Ward Discovery Mismatch Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-ward-mismatch-chaos-${Date.now()}`;
    sessions.createSessionWithAssistantText({
      sessionId: chaosSessionId,
      text: 'Spec captured during streaming',
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Ward Discovery Mismatch Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    const chaoswhispererId = 'e2e00000-0000-4000-8000-000000000011';
    const wardId = 'e2e00000-0000-4000-8000-000000000012';
    const wardResultId = 'e2e00000-0000-4000-8000-0000000000b1';
    const wardOpId = '00000000-0000-4000-8000-0000000000d2';
    const discoveredFile = 'packages/web/src/flows/home/quest-delete-from-root.e2e.ts';

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'blocked',
      // The operations ledger holds the ward run as one locked ward operation. The failed ward
      // work item links 1:1 to it (operations/<id>) and to its mismatch-only ward-result.
      operations: [
        {
          id: wardOpId,
          role: 'ward',
          text: 'ward (changed)',
          status: 'in_progress',
          locked: true,
          wardMode: 'changed',
        },
      ],
      workItems: [
        {
          id: chaoswhispererId,
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
        {
          id: wardId,
          role: 'ward',
          status: 'failed',
          spawnerType: 'command',
          dependsOn: [chaoswhispererId],
          relatedDataItems: [`operations/${wardOpId}`, `wardResults/${wardResultId}`],
          attempt: 2,
          maxAttempts: 3,
        },
      ],
      wardResults: [{ id: wardResultId, exitCode: 1, wardMode: 'changed' }],
    });

    // The mismatch-only detail blob: every check pass/skip, but the e2e check carries
    // `discoveryMismatch: true` plus the discovered-but-unprocessed file list — the sole reason
    // the run exited 1.
    quests.writeWardResultDetail({
      questFilePath: String(questFilePath),
      wardResultId,
      detail: {
        runId: '1739625600000-mismatch',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/web', path: '/repo/packages/web' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 12,
                discoveredCount: 12,
              },
            ],
          },
          {
            checkType: 'e2e',
            status: 'skip',
            discoveryMismatch: true,
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/web', path: '/repo/packages/web' },
                status: 'skip',
                errors: [],
                testFailures: [],
                filesCount: 0,
                discoveredCount: 1,
                onlyDiscovered: [discoveredFile],
                onlyProcessed: [],
              },
            ],
          },
        ],
      },
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Expand the failed [WARD] row (collapsed by default) so its ward-result detail mounts + fetches.
    const wardRow = executionPanel
      .locator('[data-testid="execution-row-header"]')
      .filter({ hasText: '[WARD]' })
      .first();

    await expect(wardRow).toBeVisible({ timeout: PANEL_TIMEOUT });

    await wardRow.click();

    // The lightweight exit-code line still renders.
    await expect(executionPanel.getByTestId('execution-row-ward-result')).toContainText(
      'Ward exit code: 1 (changed)',
      { timeout: DETAIL_TIMEOUT },
    );

    // The fix: the mismatch breakdown renders the failing check summary + the discovered file,
    // fetched from the ward-detail HTTP endpoint — NOT a blank "ward_failed".
    const wardDetail = executionPanel.getByTestId('execution-row-ward-detail');

    await expect(wardDetail).toContainText('e2e: DISCOVERY MISMATCH — 1 discovered, 0 processed', {
      timeout: DETAIL_TIMEOUT,
    });
    await expect(wardDetail).toContainText(discoveredFile, { timeout: DETAIL_TIMEOUT });
  });
});
