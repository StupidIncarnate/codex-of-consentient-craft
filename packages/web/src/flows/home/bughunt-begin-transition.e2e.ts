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
const RESPONSE_TIMEOUT = 30_000;
const IN_PROGRESS_TIMEOUT = 30_000;
const TOAST_TIMEOUT = 10_000;
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;

// A bug-hunt quest is born from `/dumpster-hunt` with its intake already on the ledger:
// questCreateBroker reads questTypeRegistryStatics['bug-hunt'].initialWorkItemRole ('bughunt') and
// seeds ONE locked operation item plus the work item that carries the intake session. That pair is
// what these tests reproduce — a feature quest's counterpart is a `chaoswhisperer` item, and the
// difference is the whole reason this file exists beside quest-begin-transition.e2e.ts.
const BUGHUNT_OP_ID = '00000000-0000-4000-8000-0000000000d1';
const BUGHUNT_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000d2';
const BUGHUNT_OP_TEXT = 'Author spec + implementation plan';

// DERIVED from the registry, never spelled out: a hardcoded ['bughunt','pesteater','ward','ward']
// still passes if questBuildRelayGraphBroker seeds a list it matched by role name rather than one
// it read off the quest's own type. Bug-hunt's startImplementationOps is a single `pesteater` seed
// (no fanOutBy, so it fans to exactly one item) and its relayTail is ward(changed) -> ward(full).
const BUG_HUNT_REGISTRY = questTypeRegistryStatics['bug-hunt'];
const EXPECTED_BUG_HUNT_LEDGER_ROLES = [
  String(BUG_HUNT_REGISTRY.initialWorkItemRole),
  ...BUG_HUNT_REGISTRY.startImplementationOps.map((seed) => String(seed.role)),
  ...BUG_HUNT_REGISTRY.relayTail.map((seed) => String(seed.role)),
];
// Whatever the feature tail carries that bug-hunt's does not — flowrider, groundstomper and
// siegemaster today, and anything added to feature tomorrow without this test needing an edit.
const FEATURE_ONLY_ROLES = questTypeRegistryStatics.feature.relayTail
  .map((seed) => String(seed.role))
  .filter((role) => !EXPECTED_BUG_HUNT_LEDGER_ROLES.includes(role));

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

    // The RESPONSE, not just the request. A 400 here is the reported symptom, and a
    // waitForRequest-only assertion passes on the run that produced it — the request is sent either
    // way. POST /start is synchronous over the whole git lifecycle (worktree add, node_modules
    // mirror, build), so this wait is deliberately long.
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

    // The seeded relay is the BUG-HUNT one, read off questTypeRegistryStatics['bug-hunt'] rather
    // than the feature tail. Asserted as the whole ordered list: a subset check ('contains a
    // pesteater') passes on a ledger that also grew a flowrider and a siegemaster.
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
    const pesteaterItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'pesteater',
    );

    expect(bughuntOp.status).toBe('complete');
    expect(bughuntItem.status).toBe('complete');
    // One assertion carries both facts: EXACTLY one pesteater work item exists (strict 1:1 with its
    // operation item), and it is chained behind the intake session. Asserting the count separately
    // from the dependsOn lets a second, unchained item slip through the pair.
    expect(pesteaterItems.map((wi: { dependsOn: string[] }) => wi.dependsOn)).toStrictEqual([
      [BUGHUNT_WORK_ITEM_ID],
    ]);
  });

  test('ERROR: {Begin Quest pressed again while the branch a prior Start already created still exists} => the real 400 is shown to the user and the quest stays startable', async ({
    page,
    request,
  }) => {
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

    const seedApprovedBugHunt = (): void => {
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
    };

    // First Start: real, and it creates the real branch + worktree in the fixture repo.
    seedApprovedBugHunt();

    const firstStart = await request.post(`/api/quests/${questId}/start`);
    expect(firstStart.status()).toBe(HTTP_OK);

    // Rewind quest.json to exactly what an INTERRUPTED Start leaves behind: still `approved`, with
    // no branchName/worktreePath recorded. Nothing is persisted until the end of POST /start, so
    // this is byte-for-byte the state a second Begin Quest observes while the first is still inside
    // its (minutes-long, on a real repo) worktree-add + build window — the window a reload widens,
    // because the modal re-arms on every load of an `approved` quest.
    seedApprovedBugHunt();

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

    // The server's own rejection — QuestBranchNameTakenError, which quest-start-responder maps to
    // 400 rather than 500 precisely so the caller can show it.
    expect(startResponse.status()).toBe(HTTP_BAD_REQUEST);
    const errorBody = await startResponse.json();
    expect(String(errorBody.error)).toContain('already exists — name is in use by other work');

    // THE POINT OF THIS TEST. Begin Quest currently swallows the failure into console.error, so the
    // modal closes, the panel never swaps, and the user is left staring at an unchanged screen with
    // no idea anything was refused. The server's message must reach the browser — the same bar
    // quest-delete-from-root.e2e.ts already holds Banish to.
    await expect(page.getByText(String(errorBody.error))).toBeVisible({ timeout: TOAST_TIMEOUT });

    // And the refusal must be non-destructive: the git lifecycle runs entirely before anything is
    // persisted, so the quest is still startable and a retry is all this costs.
    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();

    expect(questData.quest.status).toBe('approved');
  });
});
