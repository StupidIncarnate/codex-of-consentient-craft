import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-ward-crash-detail';
const PANEL_TIMEOUT = 5_000;
const DETAIL_TIMEOUT = 5_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// Regression for quest 014208d8: a failed ward whose detail is a suite-level crash (a project
// that FAILED with zero structured errors and zero test failures, the reason only in rawOutput).
// The execution panel used to show only "Ward exit code: 1 (changed)" / "Error: ward_failed" with
// no breakdown. The fix renders a "<check>: <project> — FAILED" summary plus the rawOutput.
test.describe('Failed ward row shows crash detail (no structured errors)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {blocked quest, failed ward linked to a crash-only ward-result} => expanded WARD row shows FAILED summary + rawOutput', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Ward Crash Detail Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-ward-crash-chaos-${Date.now()}`;
    sessions.createSessionWithAssistantText({
      sessionId: chaosSessionId,
      text: 'Spec captured during streaming',
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Ward Crash Detail Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    const chaoswhispererId = 'e2e00000-0000-4000-8000-000000000001';
    const wardId = 'e2e00000-0000-4000-8000-000000000002';
    const wardResultId = 'e2e00000-0000-4000-8000-0000000000a1';
    const crashStdout = 'FATAL: jest failed to run @dungeonmaster/shared integration suite';

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'blocked',
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
          relatedDataItems: [`wardResults/${wardResultId}`],
          attempt: 2,
          maxAttempts: 3,
        },
      ],
      // A step is required so the panel renders the non-planning branch (the one that passes
      // wardResults/questId to rows) — matching a real feature quest, which always has steps by
      // the time ward runs.
      steps: [{ id: 'orch-autocreate', name: 'Auto-create guild on quest creation' }],
      wardResults: [{ id: wardResultId, exitCode: 1, wardMode: 'changed' }],
    });

    // The crash-only detail blob: integration check FAILED, one project FAILED with no structured
    // errors and no test failures — the reason only in rawOutput.
    quests.writeWardResultDetail({
      questFilePath: String(questFilePath),
      wardResultId,
      detail: {
        runId: '1739625600000-crash',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'integration',
            status: 'fail',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/shared',
                  path: '/repo/packages/shared',
                },
                status: 'fail',
                errors: [],
                testFailures: [],
                passingTests: [],
                filesCount: 0,
                discoveredCount: 1,
                rawOutput: { stdout: crashStdout, stderr: '', exitCode: 1 },
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

    // The fix: the crash breakdown renders the failing check + rawOutput, fetched from the
    // ward-detail HTTP endpoint — NOT a blank "ward_failed".
    const wardDetail = executionPanel.getByTestId('execution-row-ward-detail');

    await expect(wardDetail).toContainText('integration: @dungeonmaster/shared — FAILED', {
      timeout: DETAIL_TIMEOUT,
    });
    await expect(wardDetail).toContainText(crashStdout, { timeout: DETAIL_TIMEOUT });
  });
});
