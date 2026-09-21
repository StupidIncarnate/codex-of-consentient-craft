import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-operations-driven-dispatch';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 30_000;
const LEDGER_TIMEOUT = 15_000;

// Fixed operation-item and work-item ids so the seed and the assertions reference the same ledger
// rows. The ward gate's work item is the one this spec does NOT name: `questAdvanceBroker` mints it
// once the scope ahead of it drains, which is what stamps it with the wardFull family's entry step.
const CW1_OP = '00000000-0000-4000-8000-0000000000c1';
const CW2_OP = '00000000-0000-4000-8000-0000000000c2';
const FLOW_OP = '00000000-0000-4000-8000-0000000000f1';
const WARD_OP = '00000000-0000-4000-8000-0000000000a1';
const CW1_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000010';
const CW2_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000011';
const FLOW_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000012';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// THE WARD GATE IS LAST, AND THAT IS THE LEDGER LAZY MINTING PRODUCES. `questFlowStatics` routes
// riftcarver → codeweaver → flowrider → siegemaster → wardFull → `@complete`, and `wardFull` is the
// only family whose edge reaches `@complete` — so `familyGraphCompleteDetectTransformer` derives the
// quest complete the moment every `role: 'ward'` scope is complete. A gate sitting anywhere but last
// ends the quest with scopes still outstanding.
//
// THE THREE AGENT SCOPES CARRY NO STEP, AND THAT IS DELIBERATE. A work item carrying a step belongs
// to `questRouteScopeBroker`; one carrying none is completed by its own `signal-back`, and
// `questAdvanceBroker` opens the next scope behind it. A codeweaver scope entered at its `plan` step
// with no plan file on disk folds to `empty` and takes `plan`'s `empty` edge straight to `@done` —
// which completes the scope, drains the codeweaver family, and makes the family graph mint
// FLOWRIDER's scopes on top of the one seeded here. The ward gate is the one scope this ledger
// leaves for advance to open, because `wardFull` routes to `@complete` and mints nothing behind it.
test.describe('Operations-driven dispatch', () => {
  // The full relay (4 serial dispatches: 3 fake-CLI children + 1 in-process ward) plus the
  // deadline-bounded poll runs past the 10s default per-test budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {ledger [cw, cw, flowrider, ward(full)] driven done/done/done/green} => each operation completes in order, exactly one work item per operation, quest completes', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Operations Dispatch Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Seed a quest in_progress with the ordered ledger. Each agent scope gets its OWN work item,
    // chained on the one before it so the relay dispatches them serially; the ward gate gets none,
    // so advance enters it at `gate`. The dispatcher is paused (beforeEach), so nothing runs yet.
    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Operations Dispatch Quest',
      userRequest: 'Build the feature',
      operations: [
        { id: CW1_OP, role: 'codeweaver', text: 'core: config adapter', status: 'in_progress' },
        {
          id: CW2_OP,
          role: 'codeweaver',
          text: 'core: config broker',
          status: 'pending',
          workItemId: CW2_WORK_ITEM_ID,
        },
        {
          id: FLOW_OP,
          role: 'flowrider',
          text: 'verify flows',
          status: 'pending',
          locked: true,
          workItemId: FLOW_WORK_ITEM_ID,
        },
        {
          id: WARD_OP,
          role: 'ward',
          text: 'Ward gate (full monorepo)',
          status: 'pending',
          locked: true,
        },
      ],
      firstWorkItemId: CW1_WORK_ITEM_ID,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // BEFORE: one numbered list of four — the three work items seeded 1:1 with their scopes, then
    // the ward gate, which no work item has claimed yet.
    //
    // All four read PENDING, and the first three are the reason this reads differently from the
    // ledger box it replaced. That box drew OPERATION status, which flips to `in_progress` the
    // moment `questAdvanceBroker` mints a work item for it. A row draws WORK-ITEM status, which
    // stays `pending` until something dispatches it — and every e2e test pauses the dispatcher, so
    // nothing does. That the relay advanced is asserted against the quest below, where operation
    // status actually lives.
    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(
      ['PENDING', 'PENDING', 'PENDING', 'PENDING'],
      { timeout: PANEL_TIMEOUT },
    );
    await expect(rows.getByTestId('execution-row-role-badge')).toHaveText([
      '[CODEWEAVER]',
      '[CODEWEAVER]',
      '[FLOWRIDER]',
      '[WARD]',
    ]);
    // The ward row is named by its operation text, which is where its whole-monorepo scope reads.
    await expect(rows.filter({ hasText: 'Ward gate (full monorepo)' })).toHaveCount(1);

    // Drive the relay: codeweaver -> done, codeweaver -> done, flowrider -> done, ward -> green.
    // Nothing is appended between them — the standards review runs inside each session's own turn.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'codeweaver', outcome: 'done' },
        { role: 'codeweaver', outcome: 'done' },
        { role: 'flowrider', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
      ],
    });

    // Backend truth (deadline-bounded poll): quest reaches complete, every operation item is
    // complete, and exactly four work items exist and are all complete (strict 1:1, no
    // duplicates) — one per seeded ledger row, with nothing appended beside them.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 4 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.length === 4 &&
        quest.workItems.every((wi) => wi.status === 'complete'),
    });

    // Operations stayed in the seeded order and NOTHING was appended: no repair, no pt
    // continuation, no extra ward — and no scope minted by a family route, because the only family
    // this ledger drains through a route is `wardFull`, whose edge is `@complete`.
    expect(
      finalQuest.operations.map((op) => ({ role: String(op.role), status: op.status })),
    ).toStrictEqual([
      { role: 'codeweaver', status: 'complete' },
      { role: 'codeweaver', status: 'complete' },
      { role: 'flowrider', status: 'complete' },
      { role: 'ward', status: 'complete' },
    ]);

    // The ward gate is the ONE scope advance opened, and it opened it at the wardFull family's entry
    // step. The step is what decides WHO moves a scope — the router for a stepped item, the session's
    // own `signal-back` for a step-less one — so asserting it per row is asserting which of the two
    // ran each of these scopes.
    expect(
      finalQuest.workItems.map((wi) => (wi.step === undefined ? null : String(wi.step))),
    ).toStrictEqual([null, null, null, 'gate']);

    // Strict 1:1: exactly four work items, each linked to a DISTINCT operation item. Compared
    // against the quest's own operations list rather than the seeded id constants, which proves
    // strict 1:1 across the WHOLE ledger — the claim this test makes.
    const linkedOperationRefs = finalQuest.workItems
      .map((wi) =>
        wi.relatedDataItems.map((ref) => String(ref)).find((ref) => ref.startsWith('operations/')),
      )
      .sort((a, b) => String(a).localeCompare(String(b)));
    expect(linkedOperationRefs).toStrictEqual(
      finalQuest.operations
        .map((op) => `operations/${String(op.id)}`)
        .sort((a, b) => a.localeCompare(b)),
    );

    // AFTER (UI): every operation is claimed by a work item now, so the list is four work-item rows
    // and no pending tail — all DONE, in the seeded order codeweaver, codeweaver, flowrider, ward.
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(
      ['DONE', 'DONE', 'DONE', 'DONE'],
      { timeout: LEDGER_TIMEOUT },
    );
    await expect(rows.getByTestId('execution-row-role-badge')).toHaveText([
      '[CODEWEAVER]',
      '[CODEWEAVER]',
      '[FLOWRIDER]',
      '[WARD]',
    ]);
  });
});
