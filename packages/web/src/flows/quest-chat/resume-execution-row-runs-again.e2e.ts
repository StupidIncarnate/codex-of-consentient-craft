import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-resume-execution-row-runs-again';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 25_000;
const HTTP_OK = 200;
// Inter-line delay for the resumed agent's queued outcome, so the work item this spec watches
// reads `in_progress` for roughly a second rather than the ~30 ms a default-speed fake CLI
// takes to spawn, emit three lines and signal back. The RUNNING half of the transition below
// is a state of the running agent, and at default speed that state exists for less time than
// one WS round trip plus one React paint — the row would go PENDING straight to DONE and the
// assertion would be racing a window the browser never had a chance to render.
const RUNNING_WINDOW_LINE_DELAY_MS = 400;

const DONE_OP_ID = '00000000-0000-4000-8000-0000000000d0';
const RUNNING_OP_ID = '00000000-0000-4000-8000-0000000000d1';
const DONE_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000b0';
// The row this whole spec is about: `in_progress` before the pause reset it to `pending`, carrying
// the dead/paused agent's sessionId — exactly the shape resume must pick back up, not re-spawn fresh.
// Drawn from a block no other spec uses, deliberately: the server's workItemId -> questId map is
// keyed for the whole process lifetime, so two specs sharing a work item id in one run get the
// second quest's chat-output frames stamped with the FIRST quest's questId and the browser drops
// them — a failure that only appears when the specs run in sequence.
const RESUMED_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000b10001';
const RETAINED_SESSION_ID = 'c319be5c-ef0f-4987-abea-ed45fb509bcd';
const DONE_SESSION_ID = 'a01be5c1-ef0f-4987-abea-ed45fb50aaaa';

const DONE_OP_TEXT = 'chaos: gather quest requirements';
// Hostile fixture member: one unbroken 200+ char token with no space, hyphen, or underscore
// anywhere — proves the row-identity selector still discriminates correctly against a summary a
// human would never type, and that the row's fixed-width, ellipsis-clipped Text still carries the
// full string in the DOM (the CSS clip is visual only, so a `hasText` substring match still holds).
const RUNNING_OP_TEXT =
  'ImplementQuestResumeWorktreeGitContextRestorationForOrphanedInProgressWorkItemsWithNoWhitespaceOrHyphenationAnywhereInThisIntentionallyOverlongHostileFixtureIdentifierStringUsedToProveRowSelectorsSurviveExtremeOperationSummaries';
const RUNNING_ROW_IDENTITY = RUNNING_OP_TEXT.slice(0, 60);

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Resuming a quest shows the previously in_progress execution row running again', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {paused quest, one row already complete, one row pending with a retained sessionId} => RESUME shows the retained row RUNNING again while the complete row stays untouched', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Resume Execution Row Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const created = await quests.createQuest({
      guildId,
      title: 'Resume Execution Row Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    // Two rows, two different states — the discriminator the fixture requirements demand. WI0 is
    // already done and must never move. WI1 sits `pending` with a retained sessionId: exactly what
    // quest-pause-broker leaves on disk for a work item that WAS `in_progress` when the quest was
    // paused (pause resets in_progress -> pending immediately, keeping sessionId).
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'paused',
      operations: [
        { id: DONE_OP_ID, role: 'chaoswhisperer', text: DONE_OP_TEXT, status: 'complete' },
        { id: RUNNING_OP_ID, role: 'codeweaver', text: RUNNING_OP_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: DONE_WORK_ITEM_ID,
          role: 'chaoswhisperer',
          sessionId: DONE_SESSION_ID,
          status: 'complete',
          relatedDataItems: [`operations/${DONE_OP_ID}`],
        },
        {
          id: RESUMED_WORK_ITEM_ID,
          role: 'codeweaver',
          sessionId: RETAINED_SESSION_ID,
          status: 'pending',
          relatedDataItems: [`operations/${RUNNING_OP_ID}`],
        },
      ],
    });

    // Precondition-only write: this PATCH sets the snapshot resume restores TO, not the mutation
    // under test — the mutation is the RESUME button click below.
    await request.patch(`/api/quests/${questId}`, { data: { pausedAtStatus: 'in_progress' } });

    // The agent RESUME is about to spawn needs a queued outcome, or it exits red-on-empty.
    // codeweaver is a committing role, so its `done` appends a blightscout review right after it —
    // queue that review's outcome too, or the appended work item is left running forever with
    // nothing to signal it.
    dispatch.queueScript({
      script: [
        { role: 'codeweaver', outcome: 'done' },
        { role: 'blightscout', outcome: 'done' },
      ],
      agentLineDelayMs: RUNNING_WINDOW_LINE_DELAY_MS,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    await expect(page.getByTestId('EXECUTION_RESUME_BUTTON')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('EXECUTION_PAUSE_BUTTON')).not.toBeVisible();

    const doneRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: DONE_OP_TEXT });
    // Identity AND state driven from ONE combined selector — an off-by-index bug that marked the
    // wrong row running would leave this locator matching nothing.
    const resumedRowPending = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_ROW_IDENTITY })
      .filter({ hasText: 'PENDING' });
    const resumedRowRunning = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_ROW_IDENTITY })
      .filter({ hasText: 'RUNNING' });

    // PRE-RESUME: the row that will run again is currently at rest (PENDING, not RUNNING), and the
    // other row is DONE. This is the "old UI" half of the transition.
    await expect(doneRow.getByTestId('execution-row-status-badge')).toHaveText('DONE');
    await expect(resumedRowPending).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(resumedRowRunning).not.toBeVisible();

    const resumeResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/resume`),
    );

    await page.getByTestId('EXECUTION_RESUME_BUTTON').click();

    const resumeResponse = await resumeResponsePromise;
    expect(resumeResponse.status()).toBe(HTTP_OK);
    expect(await resumeResponse.json()).toStrictEqual({
      resumed: true,
      restoredStatus: 'in_progress',
      dispatch: { started: true },
    });

    // OLD UI GONE, NEW UI APPEARED — the previously in_progress row's PENDING badge disappears and
    // the SAME row (same identity substring) reappears RUNNING. Proves it is THIS row that resumed,
    // not merely that the quest status flipped or a WS frame fired.
    await expect(resumedRowPending).not.toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(resumedRowRunning).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The row that was already done never moved.
    await expect(doneRow.getByTestId('execution-row-status-badge')).toHaveText('DONE');

    // Let the queued outcomes land so the run finishes cleanly rather than leaving a live child
    // process behind at test teardown. The resumed codeweaver item's `done` appends a blightscout
    // review right after it (codeweaver is a committing role) in the SAME persist that completes
    // it, so the review's work item already exists — and needs its own outcome — by the time
    // RESUMED_WORK_ITEM_ID reads `complete`.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.workItems.length === 3 && quest.workItems.every((wi) => wi.status === 'complete'),
    });
    expect(finalQuest.workItems.map((wi) => wi.status)).toStrictEqual([
      'complete',
      'complete',
      'complete',
    ]);
  });
});
