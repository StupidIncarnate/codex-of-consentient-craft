import { questFlowStatics } from '@dungeonmaster/shared/statics';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { dispatchPauseHarness } from '../../../test/harnesses/dispatch-pause/dispatch-pause.harness';

const GUILD_PATH = '/tmp/dm-e2e-bughunt-begin-transition';
const MODAL_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 10_000;
const RESPONSE_TIMEOUT = 5_000;
const IN_PROGRESS_TIMEOUT = 10_000;
// A real riftcarver carve mirrors node_modules and runs a preflight typecheck against the fixture
// worktree, which takes longer than the synchronous status-flip IN_PROGRESS_TIMEOUT budgets for.
const CARVE_DRAIN_TIMEOUT = 30_000;
const HTTP_OK = 200;

// A bug-hunt quest is born from `/dumpster-hunt` with its intake already on the ledger:
// questCreateBroker reads questFlowStatics['bug-hunt'].initialWorkItemRole ('bughunt') and seeds
// ONE locked operation item plus the work item that carries the intake session. That pair is what
// these tests reproduce — a feature quest's counterpart is a `chaoswhisperer` item, and the
// difference is the whole reason this file exists beside quest-begin-transition.e2e.ts.
const BUGHUNT_OP_ID = '00000000-0000-4000-8000-0000000000d1';
const BUGHUNT_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000d2';
const BUGHUNT_OP_TEXT = 'Author spec + implementation plan';

// DERIVED from the flow statics, never spelled out: a hardcoded ['bughunt', 'riftcarver'] still
// passes if questBuildRelayGraphBroker seeds a role it matched by name rather than one it read off
// the quest's own type. Start mints the ENTRY family's scopes and nothing else
// (questBuildRelayGraphBroker), so right after Start the ledger holds exactly the intake role plus
// the entry family's own role — every later family is minted only once the relay routes to it.
const BUG_HUNT_FLOW = questFlowStatics['bug-hunt'];
const ENTRY_FAMILY_ROLE = String(BUG_HUNT_FLOW.families[BUG_HUNT_FLOW.entry].role);
const EXPECTED_BUG_HUNT_LEDGER_ROLES = [
  String(BUG_HUNT_FLOW.initialWorkItemRole),
  ENTRY_FAMILY_ROLE,
];
// Every family bug-hunt shares with feature but does not seed at Start — the proof that Start mints
// the entry family alone rather than the whole relay tail.
const FEATURE_ONLY_ROLES = Object.values(questFlowStatics.feature.families)
  .map((family) => String(family.role))
  .filter((role) => !EXPECTED_BUG_HUNT_LEDGER_ROLES.includes(role));
// The relay seeds ONE work item — for the first actionable operation item, which is the carve at
// the head of the ledger — alongside the intake item already on the quest. Derived from the same
// flow statics entry so a quest type that changes what it puts first is picked up here rather than
// asserted against a name typed in by hand.
const EXPECTED_BUG_HUNT_WORK_ITEM_ROLES = [
  String(BUG_HUNT_FLOW.initialWorkItemRole),
  ENTRY_FAMILY_ROLE,
];

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// Start plays the dispatcher (QuestStartResponder, mirroring resume) as part of the same request,
// so the loop wakes on the enqueue that happens inside it and would race a REAL carve against the
// fixture repo underneath the assertions below. `POST /api/orchestration/dispatch/play` never
// refuses, so nothing in this package can hold that queue shut for the duration of a test —
// `beforeEach` only pauses a loop an EARLIER spec left running. Each test below pauses again, right
// after its own start response lands: the earliest point guaranteed to run after the dispatcher
// woke, ahead of its slower steps (a real `git worktree add` against the fixture repo). Same
// pattern as quest-begin-transition.e2e.ts's own tests.
test.describe('Bug-hunt Begin Quest transition', () => {
  test.beforeEach(async ({ request }) => {
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });

    await dispatch.beforeEach();

    await guildHarness({ request }).cleanGuilds();
    await sessions.cleanSessionDirectory();
  });

  test('VALID: {bug-hunt quest approved through the UI} => Begin Quest POSTs /start, the quest reaches in_progress, and the execution panel replaces the spec panel', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });

    // The fake ward CLI backs riftcarver's own preflight typecheck too — its queue is root-scoped
    // (the harness's own header explains why: the carve's cwd is the freshly-minted worktree, not
    // the guild path, so a cwd-scoped queue would never match). An empty queue makes that typecheck
    // fail with "queue is empty", which routes `unmet` into a spiritmender repair this spec never
    // mocks — queuing one green response here is what lets the real carve this Start's own play()
    // kicks off actually converge instead.
    dispatch.queueScript({ script: [{ role: 'riftcarver', outcome: 'green' }] });

    const guild = await guilds.createGuild({ name: 'Bug Hunt Begin Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });
    const sessionId = `e2e-bughunt-begin-${Date.now()}`;
    await sessions.createSessionFile({
      sessionId,
      userMessage: 'The clarify panel commits too early',
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Bug Hunt Begin Quest',
      userRequest: 'The clarify panel commits too early',
    });
    const questId = String(created.questId);

    // A bug-hunt quest that has finished its hunt and is sitting at the observables gate: the
    // BugHunt intake work item is still `in_progress` (the chat phase never marks itself complete —
    // Start is what promotes it), and the ledger holds nothing but its intake item. The harness's
    // default flows satisfy the one thing the `approved` gate still measures.
    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      title: 'E2E Bug Hunt Begin Quest',
      status: 'review_observables',
      questType: 'bug-hunt',
      workItems: [
        {
          id: BUGHUNT_WORK_ITEM_ID,
          role: 'bughunt',
          sessionId,
          status: 'in_progress',
          relatedDataItems: [`operations/${BUGHUNT_OP_ID}`],
        },
      ],
      operations: [
        {
          id: BUGHUNT_OP_ID,
          role: 'bughunt',
          text: BUGHUNT_OP_TEXT,
          status: 'in_progress',
          locked: true,
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });

    const specPanel = page.getByTestId('QUEST_SPEC_PANEL');
    await expect(specPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Drive the REAL gate: APPROVE issues the status PATCH, which is what re-arms the Begin-Quest
    // modal (its guard fires for exactly 'approved'). Patching the status directly would prove the
    // modal renders but not that a bug-hunt quest can reach the gate at all.
    await specPanel
      .getByTestId('ACTION_BAR')
      .getByTestId('PIXEL_BTN')
      .filter({ hasText: 'APPROVE' })
      .click();

    await expect(page.getByTestId('QUEST_APPROVED_MODAL_TITLE')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // The RESPONSE, not just the request. A non-200 here is what the reported symptom looked like,
    // and a waitForRequest-only assertion passes on the run that produced it — the request is sent
    // either way. POST /start is pure quest.json bookkeeping (the branch, the worktree and the
    // preflight typecheck belong to the riftcarver item it seeds), so it answers in milliseconds.
    const startResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/start`),
      { timeout: RESPONSE_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    const startResponse = await startResponsePromise;

    expect(startResponse.status()).toBe(HTTP_OK);

    // The response only lands after its own play() call has resolved server-side, so pausing here
    // is the earliest point guaranteed to run AFTER the dispatcher woke, ahead of its slower steps.
    await dispatchPauseHarness({ request }).pause();

    await expect(page.getByTestId('QUEST_APPROVED_MODAL_TITLE')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return null;
          }
          const data = await response.json();
          return data.quest.status;
        },
        { timeout: IN_PROGRESS_TIMEOUT },
      )
      .toBe('in_progress');

    // The UI verdict: the panel swap must happen live off the quest-modified WS event, with no
    // reload. This is the "same as a feature quest" half of the ask.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(
      page.getByTestId('execution-panel-widget').getByTestId('execution-row-layer-widget').first(),
    ).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(specPanel).not.toBeVisible();

    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();

    // The seeded relay is read off questFlowStatics['bug-hunt'] rather than assumed identical to
    // the feature graph. Asserted as the whole ordered list: a subset check ('contains a
    // riftcarver') passes on a ledger that also grew a codeweaver or a flowrider, and the order is
    // also what pins the carve to the HEAD of the relay — behind the intake item the fixture seeded.
    expect(questData.quest.operations.map((op: { role: string }) => op.role)).toStrictEqual(
      EXPECTED_BUG_HUNT_LEDGER_ROLES,
    );
    // Every later family — codeweaver, flowrider, siegemaster, ward, warpgate — is minted only once
    // the relay routes to it, never up front at Start.
    for (const role of FEATURE_ONLY_ROLES) {
      expect(questData.quest.operations.some((op: { role: string }) => op.role === role)).toBe(
        false,
      );
    }

    // Start force-completes the chat-role intake (isChatWorkItemRoleGuard covers `bughunt`) on both
    // the ledger and the work item, and mints exactly ONE work item for the first actionable
    // operation — strict 1:1 operation<->work-item.
    const bughuntOp = questData.quest.operations.find(
      (op: { role: string }) => op.role === 'bughunt',
    );
    const bughuntItem = questData.quest.workItems.find(
      (wi: { role: string }) => wi.role === 'bughunt',
    );
    const riftcarverItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'riftcarver',
    );

    expect(bughuntOp.status).toBe('complete');
    expect(bughuntItem.status).toBe('complete');
    // The whole work-item list, in order: the intake item plus the ONE item the relay minted. A
    // filter-and-count on a single role never notices a second, unrelated item appearing beside it.
    expect(questData.quest.workItems.map((wi: { role: string }) => wi.role)).toStrictEqual(
      EXPECTED_BUG_HUNT_WORK_ITEM_ROLES,
    );
    // One assertion carries two more facts about that minted item: it is the dispatcher's to run
    // rather than Claude's, and it is chained behind the intake session.
    expect(
      riftcarverItems.map((wi: { spawnerType: string; dependsOn: string[] }) => ({
        spawnerType: wi.spawnerType,
        dependsOn: wi.dependsOn,
      })),
    ).toStrictEqual([{ spawnerType: 'command', dependsOn: [BUGHUNT_WORK_ITEM_ID] }]);

    // Drain the real carve this test's own pause did not stop — it only prevents a FUTURE dispatch
    // tick, not the git worktree add/typecheck already in flight. Waiting for it to land a
    // riftcarverResults entry here (rather than leaving it running past this test's own end) is what
    // keeps it from still touching this guild path's shared .git when the NEXT test's own
    // environment reset (worktree prune + re-carve) runs concurrently against it.
    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return 0;
          }
          const data = await response.json();
          return data.quest.riftcarverResults.length;
        },
        { timeout: CARVE_DRAIN_TIMEOUT },
      )
      .toBeGreaterThan(0);
  });

  test('VALID: {Begin Quest pressed again on a quest whose relay a prior Start already seeded} => the second Start mints no second carve and the quest still reaches execution', async ({
    page,
    request,
  }) => {
    // Pressing Begin Quest a second time is reachable whenever a Start seeded the ledger but did
    // not finish: the seed, the promoted intake item and the carve's work item ride ONE atomic
    // write, and the approved -> in_progress flip is a SEPARATE one, so a crash between them leaves
    // a quest that is fully seeded and still `approved` — and every load of an `approved` quest
    // re-arms the modal. What the second press must not do is double-seed: two riftcarver items
    // would carve twice against one branch name, and the second carve refuses itself.
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });

    // Same reasoning as the sibling test's own comment: queue a green response for riftcarver's own
    // preflight typecheck before the first real Start below, or its fake-ward call finds an empty
    // queue and mints a spiritmender repair this spec never mocks.
    dispatch.queueScript({ script: [{ role: 'riftcarver', outcome: 'green' }] });

    const guild = await guilds.createGuild({ name: 'Bug Hunt Restart Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });
    const sessionId = `e2e-bughunt-restart-${Date.now()}`;
    await sessions.createSessionFile({
      sessionId,
      userMessage: 'The clarify panel commits too early',
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Bug Hunt Restart Quest',
      userRequest: 'The clarify panel commits too early',
    });
    const questId = String(created.questId);

    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      title: 'E2E Bug Hunt Restart Quest',
      status: 'approved',
      questType: 'bug-hunt',
      workItems: [
        {
          id: BUGHUNT_WORK_ITEM_ID,
          role: 'bughunt',
          sessionId,
          status: 'in_progress',
          relatedDataItems: [`operations/${BUGHUNT_OP_ID}`],
        },
      ],
      operations: [
        {
          id: BUGHUNT_OP_ID,
          role: 'bughunt',
          text: BUGHUNT_OP_TEXT,
          status: 'in_progress',
          locked: true,
        },
      ],
    });

    // First Start: real, through the same endpoint the button calls. The ledger the rest of this
    // test measures is therefore one Start actually produced, not one the fixture hand-wrote.
    const firstStart = await dispatch.startQuestViaStartRoute({ questId });
    expect(firstStart.status).toBe(HTTP_OK);

    // Pause right after this response lands, same reasoning as the sibling test: the earliest point
    // guaranteed to run after the dispatcher woke, before the rewind below races a real carve.
    await dispatchPauseHarness({ request }).pause();

    // The pause stops a FUTURE dispatch tick, not the carve this one already started — so drain it
    // to a real riftcarverResults entry before rewinding the status. Same reasoning as the sibling
    // test's own drain at its end: an in-flight carve must not still be touching this guild path's
    // git repo once the rewind + second Begin Quest below start mutating it again.
    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return 0;
          }
          const data = await response.json();
          return data.quest.riftcarverResults.length;
        },
        { timeout: CARVE_DRAIN_TIMEOUT },
      )
      .toBeGreaterThan(0);

    const afterFirstStartResponse = await request.get(`/api/quests/${questId}`);
    const afterFirstStart = await afterFirstStartResponse.json();

    // Pin the pre-state so the "unchanged" assertions below cannot pass vacuously: an empty ledger
    // compared against an empty ledger is still equal.
    expect(afterFirstStart.quest.operations.map((op: { role: string }) => op.role)).toStrictEqual(
      EXPECTED_BUG_HUNT_LEDGER_ROLES,
    );
    expect(afterFirstStart.quest.workItems.map((wi: { role: string }) => wi.role)).toStrictEqual(
      EXPECTED_BUG_HUNT_WORK_ITEM_ROLES,
    );

    const seededOperationIds = afterFirstStart.quest.operations.map((op: { id: string }) => op.id);
    const seededWorkItemIds = afterFirstStart.quest.workItems.map((wi: { id: string }) => wi.id);

    // Rewind ONLY the status, leaving every other byte the first Start wrote. That is exactly the
    // state the crash window above leaves, and it is what a reload re-arms the modal on. Rebuilding
    // the file through writeQuestFile instead would hand the second Start a ledger the fixture
    // authored, which is the one thing this test must not measure.
    await quests.rewindQuestStatus({ questFilePath: String(created.filePath), status: 'approved' });

    await nav.navigateToQuest({ urlSlug, questId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    // No APPROVE click needed: loading an already-`approved` quest re-arms the modal by itself.
    await expect(page.getByTestId('QUEST_APPROVED_MODAL_TITLE')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    const startResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/start`),
      { timeout: RESPONSE_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    const startResponse = await startResponsePromise;

    // The second Start is ACCEPTED. Its idempotency probe reads the already-seeded verify tail (a
    // locked ward item) and skips straight to the status transition, so there is no refusal for the
    // user to read — the honest surface is the quest carrying on into execution.
    expect(startResponse.status()).toBe(HTTP_OK);

    // Same reasoning as this test's first start: pause the instant this response lands, ahead of
    // the dispatcher's slower steps.
    await dispatchPauseHarness({ request }).pause();

    await expect(page.getByTestId('QUEST_APPROVED_MODAL_TITLE')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();

    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();

    // The drain above (needed to let the first start's own real carve land rather than race a
    // rewrite) means riftcarver's scope is genuinely terminal by the time this second Start plays
    // the dispatcher again — so a fresh scan is free to route the relay on into codeweaver exactly
    // as it would for any quest whose carve already finished. That forward progress is not a
    // double-seed; it is what "the quest still reaches execution" (this test's own title) means once
    // the ledger is no longer artificially frozen. What "no second carve" actually forbids is a
    // SECOND riftcarver operation/work item minted for the SAME scope — comparing ids rather than
    // roles catches that, since a re-mint carries the same role name as the first and would slide
    // past a role-count check alone.
    const seededOperationIdSet = new Set(seededOperationIds);
    const seededWorkItemIdSet = new Set(seededWorkItemIds);
    expect(
      questData.quest.operations
        .map((op: { id: string }) => op.id)
        .filter((id: string) => seededOperationIdSet.has(id)),
    ).toStrictEqual(seededOperationIds);
    expect(
      questData.quest.workItems
        .map((wi: { id: string }) => wi.id)
        .filter((id: string) => seededWorkItemIdSet.has(id)),
    ).toStrictEqual(seededWorkItemIds);
    expect(
      questData.quest.workItems.filter((wi: { role: string }) => wi.role === 'riftcarver'),
    ).toHaveLength(1);
    expect(questData.quest.status).toBe('in_progress');
  });
});
