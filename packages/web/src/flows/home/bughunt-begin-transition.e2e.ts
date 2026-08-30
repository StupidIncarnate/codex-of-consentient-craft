import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-bughunt-begin-transition';
const MODAL_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 10_000;
const RESPONSE_TIMEOUT = 5_000;
const IN_PROGRESS_TIMEOUT = 10_000;
const HTTP_OK = 200;

// A bug-hunt quest is born from `/dumpster-hunt` with its intake already on the ledger:
// questCreateBroker reads questTypeRegistryStatics['bug-hunt'].initialWorkItemRole ('bughunt') and
// seeds ONE locked operation item plus the work item that carries the intake session. That pair is
// what these tests reproduce — a feature quest's counterpart is a `chaoswhisperer` item, and the
// difference is the whole reason this file exists beside quest-begin-transition.e2e.ts.
const BUGHUNT_OP_ID = '00000000-0000-4000-8000-0000000000d1';
const BUGHUNT_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000d2';
const BUGHUNT_OP_TEXT = 'Author spec + implementation plan';

// DERIVED from the registry, never spelled out: a hardcoded
// ['bughunt','riftcarver','codeweaver','ward','flowrider','siegemaster','ward'] still passes if
// questBuildRelayGraphBroker seeds a list it matched by role name rather than one it read off the
// quest's own type. Bug-hunt shares the feature relay wholesale — the `riftcarver` carve, the
// `codeweaver` build (neither carries fanOutBy at this seed-list level, so each fans to exactly one
// entry here), then relayTail's ward(changed) -> flowrider -> siegemaster -> ward(full).
const BUG_HUNT_REGISTRY = questTypeRegistryStatics['bug-hunt'];
const EXPECTED_BUG_HUNT_LEDGER_ROLES = [
  String(BUG_HUNT_REGISTRY.initialWorkItemRole),
  ...BUG_HUNT_REGISTRY.startImplementationOps.map((seed) => String(seed.role)),
  ...BUG_HUNT_REGISTRY.relayTail.map((seed) => String(seed.role)),
];
// Whatever the feature tail carries that bug-hunt's does not — nothing today, since the two quest
// types share one relay tail, but this stays derived so a role added to feature alone tomorrow is
// still caught without this test needing an edit.
const FEATURE_ONLY_ROLES = questTypeRegistryStatics.feature.relayTail
  .map((seed) => String(seed.role))
  .filter((role) => !EXPECTED_BUG_HUNT_LEDGER_ROLES.includes(role));
// The relay seeds ONE work item — for the first actionable operation item, which is the carve at
// the head of the ledger — alongside the intake item already on the quest. Derived from the same
// registry entry so a quest type that changes what it puts first is picked up here rather than
// asserted against a name typed in by hand.
const EXPECTED_BUG_HUNT_WORK_ITEM_ROLES = [
  String(BUG_HUNT_REGISTRY.initialWorkItemRole),
  String(BUG_HUNT_REGISTRY.startImplementationOps[0].role),
];

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Bug-hunt Begin Quest transition', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {bug-hunt quest approved through the UI} => Begin Quest POSTs /start, the quest reaches in_progress, and the execution panel replaces the spec panel', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Bug Hunt Begin Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });
    const sessionId = `e2e-bughunt-begin-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'The clarify panel commits too early' });

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
    quests.writeQuestFile({
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
    // preflight build belong to the riftcarver item it seeds), so it answers in milliseconds.
    const startResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/start`),
      { timeout: RESPONSE_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    const startResponse = await startResponsePromise;

    expect(startResponse.status()).toBe(HTTP_OK);

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
    await expect(page.getByTestId('OPERATIONS_LEDGER')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(specPanel).not.toBeVisible();

    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();

    // The seeded relay is read off questTypeRegistryStatics['bug-hunt'] rather than assumed
    // identical to the feature tail. Asserted as the whole ordered list: a subset check ('contains a
    // codeweaver') passes on a ledger that also grew a flowrider and a siegemaster, and the order is
    // also what pins the carve to the HEAD of the relay — behind the intake item the fixture seeded
    // and ahead of the codeweaver that builds in the tree it creates.
    expect(questData.quest.operations.map((op: { role: string }) => op.role)).toStrictEqual(
      EXPECTED_BUG_HUNT_LEDGER_ROLES,
    );
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

    const guild = await guilds.createGuild({ name: 'Bug Hunt Restart Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });
    const sessionId = `e2e-bughunt-restart-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'The clarify panel commits too early' });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Bug Hunt Restart Quest',
      userRequest: 'The clarify panel commits too early',
    });
    const questId = String(created.questId);

    quests.writeQuestFile({
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
    const firstStart = await request.post(`/api/quests/${questId}/start`);
    expect(firstStart.status()).toBe(HTTP_OK);

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
    quests.rewindQuestStatus({ questFilePath: String(created.filePath), status: 'approved' });

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

    await expect(page.getByTestId('QUEST_APPROVED_MODAL_TITLE')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();

    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();

    // Nothing appended and nothing re-minted: the SAME operation items and the SAME work items, by
    // id, in the same order. Comparing ids rather than roles is what catches a second carve, which
    // carries the same role name as the first and would slide past a role-list check.
    expect(questData.quest.operations.map((op: { id: string }) => op.id)).toStrictEqual(
      seededOperationIds,
    );
    expect(questData.quest.workItems.map((wi: { id: string }) => wi.id)).toStrictEqual(
      seededWorkItemIds,
    );
    expect(questData.quest.status).toBe('in_progress');
  });
});
