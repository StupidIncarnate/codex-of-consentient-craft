import { AssistantTextStreamLineStub } from '@dungeonmaster/shared/contracts';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-carved-quest-session-cwds';
const WORKTREE_NAME = 'carved-quest-session-cwds-quest';
// Where `carveQuestWorktree` puts the worktree, and therefore the cwd every role after riftcarver
// runs in. Claude CLI encodes its session-JSONL directory from that cwd, so this one path is the
// SECOND of the two directories this spec's transcripts are split across.
const WORKTREE_PATH = `${GUILD_PATH}/worktrees/${WORKTREE_NAME}`;

const PANEL_TIMEOUT = 10_000;
// Row text arrives over the socket, so this waits on the server booting and on `subscribe-quest`
// replaying EVERY work item on the quest — not on a render. Under a whole-package sweep the
// dungeonmaster home holds every earlier spec's guild, so the replay's own quest walk is longer
// here than it is alone. The describe's own budget is 120s, so this stays well inside it.
const TEXT_TIMEOUT = 20_000;
// The live tail additionally waits on the quest-driven watcher's reconcile poll noticing the
// running work item and attaching a tail to its session file.
const STREAM_TIMEOUT = 30_000;

const INTAKE_SESSION_ID = 'e2e-carved-intake-session';
const CODEWEAVER_SESSION_ID = 'e2e-carved-codeweaver-session';

const INTAKE_TEXT = 'Chaoswhisperer pinned the scope at the guild root, before any carve';
const CODEWEAVER_TEXT = 'Codeweaver opened the package from inside the carved worktree';
const CODEWEAVER_LIVE_TEXT = 'Codeweaver appended this while the panel was already open';

const INTAKE_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000e1';
const CODEWEAVER_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000e2';
const CODEWEAVER_OP_ID = '00000000-0000-4000-8000-0000000000e3';
const RIFTCARVER_OP_ID = '00000000-0000-4000-8000-0000000000e4';
const RIFTCARVER_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000e5';

const CODEWEAVER_OP_TEXT = 'auth-service: broker slice';
// The row a work item with no linked operation item takes its name from is its own role, title-cased
// by ExecutionPanelWidget. That is the intake row's only label.
const INTAKE_ROW_LABEL = 'Chaoswhisperer';
// `executionStepStatusConfigStatics.statusConfig.in_progress.label` — the badge a row wears while
// its work item is the one this fixture keeps running.
const RUNNING_BADGE = 'RUNNING';

const INTAKE_STARTED_AT = '2026-05-01T10:00:00.000Z';
const CODEWEAVER_STARTED_AT = '2026-05-01T11:00:00.000Z';

const environment = environmentHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: environment, testObj: test });

// TWO session harnesses, because a session harness is scoped to ONE directory: it encodes the JSONL
// path from the path it was built with. One writes under the guild root's encoding and one under the
// worktree's, which is exactly the split a carve produces on disk — and it is what lets each of them
// clear only its own tree between tests.
const guildSessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const worktreeSessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: WORKTREE_PATH }),
  testObj: test,
});

// THE BUG THIS EXISTS FOR.
//
// Claude CLI writes a session transcript to `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl`,
// and the directory comes from the SESSION's own cwd. A carve moves that cwd, so a carved quest's
// transcripts sit in TWO directories at once: the intake conversation ran at the guild root, every
// role dispatched after riftcarver ran in the worktree. Both read paths — the subscribe-quest replay
// that fills the execution rows, and the quest-driven watcher that tails a running session —
// recomputed ONE directory per QUEST from `worktreePath`. That answer reaches at most one of the two
// groups, and the group it missed was the intake: once a quest was carved its intake row rendered
// EMPTY, live and after a reload alike.
//
// The quest's own `sessions` ledger records each session's cwd as it is stamped, and both read paths
// look a session up there before falling back to the per-quest guess. So the fixture below is the
// smallest arrangement that can tell a per-session answer from a per-quest one: a REAL carved
// worktree, a transcript in each of the two encodings, and a ledger row for each.
//
// The carve is seeded rather than driven because whether riftcarver can carve is riftcarver's own
// test to earn; what this one measures is where the transcripts of the sessions either side of it
// are looked for.
test.describe('A carved quest renders the transcripts on both sides of its carve', () => {
  // Two page loads plus a deadline-bounded live-tail poll run past the 10s default per-test budget.
  test.describe.configure({ timeout: 120_000 });

  // THIS QUEST IS A FIXTURE, AND THE NODE DISPATCHER MUST NOT SEE IT. Its codeweaver work item is
  // seeded `in_progress` carrying a sessionId with no live agent behind it, which is precisely the
  // shape `recoverOrphanedWorkItemsLayerBroker` exists to clean up: every dispatch scan resets an
  // ACTIVE work item and bumps its `retryCount`, and at `slotManagerStatics.orphanRecovery.maxResets`
  // the quest blocks and the item goes `failed`. `ExecutionRowLayerWidget` collapses a row that
  // leaves `in_progress`, so the transcript below is folded away while the row header still reports
  // its token count — a failure that reads as "the transcript never arrived" and is nothing of the
  // kind. Measured on one whole-package run: row 03 rendered `▸ … 100 ctx FAILED` with the quest on
  // RESUME QUEST.
  //
  // `beforeEach` pauses a loop an earlier spec left playing (the mode the loop reads is an in-memory
  // mirror, so writing the state file alone does not stop one); the heartbeat hold is the production
  // play gate's own signal and refuses every later unforced play, including the one `POST /start`
  // makes on a user's behalf.
  test.beforeEach(async ({ request }) => {
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });

    await dispatch.beforeEach();
    dispatch.holdQueueWithMcpHeartbeat();

    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {carved quest, intake session recorded at the guild root, codeweaver session recorded in the worktree} => both rows render their own transcript, again after a reload, and the running row keeps streaming', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Carved Quest Session Cwds Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guilds.extractGuildId({ guild }));
    const urlSlug = guilds.extractUrlSlug({ guild });

    // A real worktree, on its own branch, in the directory a real carve uses — and deliberately NOT
    // the guild path, or the two resolutions this spec separates would agree by accident.
    const worktreePath = environment.carveQuestWorktree({ name: WORKTREE_NAME });

    // The module-scope worktree session harness encodes its JSONL directory from WORKTREE_PATH, so a
    // carve landing anywhere else would have it writing where nothing reads. Assert the agreement
    // rather than assuming it.
    expect(String(worktreePath)).toBe(WORKTREE_PATH);

    // The two transcripts, each written in the encoding the session that produced it really ran
    // under.
    guildSessions.createSessionWithAssistantText({
      sessionId: INTAKE_SESSION_ID,
      text: INTAKE_TEXT,
    });
    worktreeSessions.createSessionWithAssistantText({
      sessionId: CODEWEAVER_SESSION_ID,
      text: CODEWEAVER_TEXT,
    });

    const created = await quests.createQuest({
      guildId,
      title: 'Carved Quest Session Cwds Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;

    // The ledger a carved quest carries once its first codeweaver is running: riftcarver complete at
    // the head, the intake work item force-completed by Start, the codeweaver cell in flight. The
    // `sessions` rows are what a real run appends as each session is stamped.
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(created.filePath),
      title: 'Carved Quest Session Cwds Quest',
      status: 'in_progress',
      worktreePath: String(worktreePath),
      operations: [
        {
          id: RIFTCARVER_OP_ID,
          role: 'riftcarver',
          text: 'carve the quest branch',
          status: 'complete',
        },
        {
          id: CODEWEAVER_OP_ID,
          role: 'codeweaver',
          text: CODEWEAVER_OP_TEXT,
          status: 'in_progress',
        },
      ],
      workItems: [
        {
          id: INTAKE_WORK_ITEM_ID,
          role: 'chaoswhisperer',
          sessionId: INTAKE_SESSION_ID,
          status: 'complete',
        },
        {
          id: RIFTCARVER_WORK_ITEM_ID,
          role: 'riftcarver',
          status: 'complete',
          spawnerType: 'command',
          relatedDataItems: [`operations/${RIFTCARVER_OP_ID}`],
        },
        {
          id: CODEWEAVER_WORK_ITEM_ID,
          role: 'codeweaver',
          sessionId: CODEWEAVER_SESSION_ID,
          status: 'in_progress',
          relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
        },
      ],
      sessions: [
        {
          sessionId: INTAKE_SESSION_ID,
          cwd: GUILD_PATH,
          role: 'chaoswhisperer',
          workItemId: INTAKE_WORK_ITEM_ID,
          startedAt: INTAKE_STARTED_AT,
        },
        {
          sessionId: CODEWEAVER_SESSION_ID,
          cwd: String(worktreePath),
          role: 'codeweaver',
          workItemId: CODEWEAVER_WORK_ITEM_ID,
          startedAt: CODEWEAVER_STARTED_AT,
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const intakeRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: INTAKE_ROW_LABEL });
    const codeweaverRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: CODEWEAVER_OP_TEXT });

    await expect(intakeRow).toHaveCount(1, { timeout: PANEL_TIMEOUT });
    await expect(codeweaverRow).toHaveCount(1, { timeout: PANEL_TIMEOUT });

    // The codeweaver row opens ITSELF, and only while its work item is `in_progress`. Both halves
    // are asserted before the text, so a fixture moved out from under the transcript fails naming
    // the status it moved to or the row that stayed shut, rather than as a transcript that never
    // arrived. Same pair after the reload below.
    await expect(codeweaverRow.getByTestId('execution-row-status-badge')).toHaveText(
      RUNNING_BADGE,
      {
        timeout: PANEL_TIMEOUT,
      },
    );
    await expect(codeweaverRow.getByTestId('execution-row-expanded')).toBeVisible({
      timeout: TEXT_TIMEOUT,
    });

    // The post-carve side. This text exists only under the WORKTREE's path encoding.
    await expect(codeweaverRow.getByText(CODEWEAVER_TEXT).first()).toBeVisible({
      timeout: TEXT_TIMEOUT,
    });

    // THE REGRESSION GUARD. The intake row is complete, so it opens on a click rather than by
    // itself — but its transcript was already delivered by this page load's subscribe-quest replay,
    // and the click only reveals it. This text exists ONLY under the GUILD ROOT's path encoding, so
    // seeing it means the replay resolved the directory from the SESSION rather than from the
    // quest's `worktreePath`. Resolved per-quest, this row is empty and the click reveals nothing.
    await intakeRow.getByTestId('execution-row-header').click();

    await expect(intakeRow.getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(intakeRow.getByText(INTAKE_TEXT).first()).toBeVisible({ timeout: TEXT_TIMEOUT });

    // Exactly one navigation entry: everything above arrived over the socket this page load opened,
    // with no reload — which is the half of the symptom a reader hits first.
    const navigationCountBeforeReload = await page.evaluate(
      () => globalThis.performance.getEntriesByType('navigation').length,
    );

    expect(navigationCountBeforeReload).toBe(1);

    // A reload throws away everything the first load delivered and re-reads both transcripts off
    // disk, so both rows have to come back — the same two directories, resolved again from the
    // ledger.
    await page.reload();

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(codeweaverRow.getByTestId('execution-row-status-badge')).toHaveText(
      RUNNING_BADGE,
      {
        timeout: PANEL_TIMEOUT,
      },
    );
    await expect(codeweaverRow.getByTestId('execution-row-expanded')).toBeVisible({
      timeout: TEXT_TIMEOUT,
    });
    await expect(codeweaverRow.getByText(CODEWEAVER_TEXT).first()).toBeVisible({
      timeout: TEXT_TIMEOUT,
    });

    await intakeRow.getByTestId('execution-row-header').click();

    await expect(intakeRow.getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(intakeRow.getByText(INTAKE_TEXT).first()).toBeVisible({ timeout: TEXT_TIMEOUT });

    // THE LIVE TAIL, the other read path, and it goes LAST on purpose: an execution row collapses to
    // the tail window, so the moment a newer message anchor lands every assertion above it is
    // reading a transcript the row has folded away. The quest-driven watcher resolves the running
    // codeweaver session's directory through the same ledger and tails that file, so a line appended
    // now reaches the row with no further reload. A stable uuid keeps the repeated appends below one
    // entry rather than one per poll.
    const liveLine = JSON.stringify({
      ...AssistantTextStreamLineStub({
        message: { role: 'assistant', content: [{ type: 'text', text: CODEWEAVER_LIVE_TEXT }] },
      }),
      uuid: `${CODEWEAVER_SESSION_ID}-live`,
    });

    // The watcher's reactor attaches on a quest-modified event or a fallback poll, so a single append
    // racing that window would emit nothing. Re-append on each poll rather than sleeping: the first
    // append after the tail attaches streams, and the assertion still fails honestly if the tail
    // never starts at all.
    await expect
      .poll(
        async () => {
          worktreeSessions.appendMainSessionLine({
            sessionId: CODEWEAVER_SESSION_ID,
            line: liveLine,
          });
          return codeweaverRow.getByText(CODEWEAVER_LIVE_TEXT).first().isVisible();
        },
        { timeout: STREAM_TIMEOUT },
      )
      .toBe(true);
  });
});
