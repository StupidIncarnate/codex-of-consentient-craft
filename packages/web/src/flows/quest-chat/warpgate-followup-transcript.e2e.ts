import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { warpgateHarness } from '../../../test/harnesses/warpgate/warpgate.harness';

const GUILD_PATH = '/tmp/dm-e2e-warpgate-followup-transcript';
const PANEL_TIMEOUT = 10_000;
const REPLAY_TIMEOUT = 10_000;
const HTTP_OK = 200;

// Two full turns (four lines) so "the transcript survived" is distinguishable from "the last
// message survived" — a bug that dropped the earlier turn and kept only the latest one would
// pass a check that only looked for the SECOND user question.
const FIRST_USER_TURN = 'Was the intake merge clean before you started?';
const FIRST_ASSISTANT_TURN = 'Yes — no conflicts, and ward was green on the quest branch.';
const SECOND_USER_TURN = 'What about the base merge — did that go through too?';
const SECOND_ASSISTANT_TURN = 'That part is still pending; I will report back once it lands.';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('FOLLOW-UP tab transcript survives being stopped for a merge', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {2 prior FOLLOW-UP turns, then Merge pressed} => both prior turns still render in the FOLLOW-UP tab afterward', async ({
    page,
    request,
  }) => {
    const warpgate = warpgateHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });
    const { urlSlug, questId, questFolder, questFilePath } = await warpgate.setup({
      guildName: 'Followup Survives Stop Guild',
      title: 'Followup Survives Stop Quest',
    });

    const tavernkeeperSessionId = `e2e-tavernkeeper-${Date.now()}`;
    warpgate.seedFollowupTurns({
      sessionId: tavernkeeperSessionId,
      turns: [
        { role: 'user', text: FIRST_USER_TURN },
        { role: 'assistant', text: FIRST_ASSISTANT_TURN },
        { role: 'user', text: SECOND_USER_TURN },
        { role: 'assistant', text: SECOND_ASSISTANT_TURN },
      ],
    });

    // A quest already blocked — mergeable AND followup-chatable at once, so this one test can
    // open the transcript, then swap to the tab that carries the real Merge button.
    warpgate.seedWarpgateQuest({
      questId,
      questFolder,
      questFilePath,
      status: 'blocked',
      warpgateStatus: 'pending',
      tavernkeeperSessionId,
    });

    await nav.navigateToQuest({ urlSlug, questId });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Open the FOLLOW-UP tab via the real control (opens AND switches in one click).
    await page.getByTestId('EXECUTION_FOLLOWUP_BUTTON').click();

    const followupTab = page.getByTestId('execution-panel-tab-followup');
    await expect(followupTab).toBeVisible({ timeout: PANEL_TIMEOUT });

    // FAILS IF replay never populated the tavernkeeper session's transcript, or populated only
    // the newest turn.
    await expect(page.getByText(FIRST_USER_TURN)).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(page.getByText(FIRST_ASSISTANT_TURN)).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(page.getByText(SECOND_USER_TURN)).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(page.getByText(SECOND_ASSISTANT_TURN)).toBeVisible({ timeout: REPLAY_TIMEOUT });

    // Swap to EXECUTION — the Merge button only renders there, never on the FOLLOW-UP tab.
    await page.getByTestId('execution-panel-tab-execution').click();
    const mergeButton = page.getByTestId('EXECUTION_MERGE_BUTTON');
    await expect(mergeButton).toBeVisible({ timeout: PANEL_TIMEOUT });

    const mergeResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/merge`),
    );
    await mergeButton.click();
    const mergeResponse = await mergeResponsePromise;
    expect(mergeResponse.status()).toBe(HTTP_OK);

    // The quest is now `merging` — isFollowupChatableQuestStatusGuard is false there, so the
    // post-quest bar's FOLLOW-UP button is gone, but the already-open tab is gated on the PRESS
    // (followupTabOpen), not on status, so it keeps rendering. Switch back to it.
    await page.getByTestId('execution-panel-tab-followup').click();
    await expect(page.getByTestId('execution-panel-tab-followup')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // FAILS IF the transcript came back empty, or kept only the latest turn, once the session
    // was stopped and the quest moved on to `merging`.
    await expect(page.getByText(FIRST_USER_TURN)).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(page.getByText(FIRST_ASSISTANT_TURN)).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(page.getByText(SECOND_USER_TURN)).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(page.getByText(SECOND_ASSISTANT_TURN)).toBeVisible({ timeout: REPLAY_TIMEOUT });
  });
});
