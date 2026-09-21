import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-operations-ward-recovery';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 25_000;
const LEDGER_TIMEOUT = 15_000;

// The gate's work item is the one neither case names: `questAdvanceBroker` mints it once the scope
// ahead of it drains, which is what stamps it with the wardFull family's entry step and flips its
// operation item to `in_progress` — the status `questRouteScopeBroker` needs to see the scope at
// all.
const FLOW_OP = '00000000-0000-4000-8000-0000000000f1';
const WARD_OP = '00000000-0000-4000-8000-0000000000a1';
const FLOW_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000010';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// THE RECOVERY IS THE STEP GRAPH'S OWN LOOP, not a spliced operation. `agentFlowStatics.wardFull`
// declares `gate --unmet--> repair --done--> commit --done--> gate`, so a red gate mints a repair
// work item on the SAME scope and the fresh gate that follows it is another work item on that same
// scope — the ledger gains no operation item at all. The `pt N` continuation the ledger used to
// grow is reachable only through `questRunWardBroker`, which answers a ward work item carrying NO
// step; a gate work item carrying one is dispatched as a `run-step` and routed by
// `questRouteScopeBroker` instead.
//
// THE GATE IS THE LEDGER'S LAST SCOPE. `wardFull` is the only family whose edge reaches
// `@complete`, and `familyGraphCompleteDetectTransformer` derives the quest complete the moment
// every `role: 'ward'` scope is complete — so a gate sitting anywhere but last ends the quest with
// scopes still outstanding. The flowrider scope ahead of it carries no step, which is what keeps it
// out of the router: a stepped agent scope that completes drains its family, and the family graph
// then mints the NEXT family's scopes on top of the ledger this spec seeded.
test.describe('Ward as an operation (advance on green, step-graph repair loop on red)', () => {
  // Each case runs the full relay (real in-process ward runs + fake-CLI children) plus the
  // deadline-bounded poll, past the 10s default per-test budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {ledger [flowrider, ward(full)] driven done/green} => the gate takes its `done` edge, its scope completes on that ONE work item and the quest reaches complete; no repair minted', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Ward Green Advance Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Ward Green Advance Quest',
      userRequest: 'Build the feature',
      operations: [
        { id: FLOW_OP, role: 'flowrider', text: 'verify flows', status: 'in_progress' },
        {
          id: WARD_OP,
          role: 'ward',
          text: 'Ward gate (full monorepo)',
          status: 'pending',
          locked: true,
        },
      ],
      firstWorkItemId: FLOW_WORK_ITEM_ID,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // BEFORE: one numbered list — the flowrider work item, then the gate's. The gate row is named by
    // its operation text, which is where its whole-monorepo scope reads.
    //
    // Both read PENDING. The ledger box this replaced drew OPERATION status, which flips to
    // `in_progress` when a work item is minted; a row draws WORK-ITEM status, which stays `pending`
    // until something dispatches it, and every e2e test pauses the dispatcher.
    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(
      ['PENDING', 'PENDING'],
      {
        timeout: PANEL_TIMEOUT,
      },
    );
    await expect(rows.getByTestId('execution-row-role-badge')).toHaveText([
      '[FLOWRIDER]',
      '[WARD]',
    ]);
    await expect(rows.filter({ hasText: 'Ward gate (full monorepo)' })).toHaveCount(1);

    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'flowrider', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
      ],
    });

    // A green gate takes `gate`'s `done` edge to `@done`, which completes the scope; `wardFull` then
    // drains and the family graph reaches `@complete`. No repair step is minted (that is the `unmet`
    // edge only) and no spiritmender operation is spliced — the ledger ends at exactly the two
    // seeded rows.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 2 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.length === 2 &&
        quest.workItems.every((wi) => wi.status === 'complete'),
    });

    expect(
      finalQuest.operations.map((op) => ({
        role: String(op.role),
        status: op.status,
      })),
    ).toStrictEqual([
      { role: 'flowrider', status: 'complete' },
      { role: 'ward', status: 'complete' },
    ]);

    // The gate scope carries exactly ONE work item, at `gate`. A repair would have been a second
    // work item on this same scope at `repair`, so the step list IS the "no recovery ran" assertion —
    // a count of operation items could not see it, because the step-graph loop appends none.
    expect(
      finalQuest.workItems.map((wi) => ({
        role: String(wi.role),
        step: wi.step === undefined ? null : String(wi.step),
        status: wi.status,
      })),
    ).toStrictEqual([
      { role: 'flowrider', step: null, status: 'complete' },
      { role: 'ward', step: 'gate', status: 'complete' },
    ]);

    // AFTER (UI): both rows read DONE; no recovery row appeared.
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(['DONE', 'DONE'], {
      timeout: LEDGER_TIMEOUT,
    });
    await expect(rows.getByTestId('execution-row-role-badge')).toHaveText([
      '[FLOWRIDER]',
      '[WARD]',
    ]);
  });

  test('VALID: {ledger [flowrider, ward(full)] driven done/red/done/green} => the red gate routes `unmet` to a repair, the repair commits and returns to a FRESH gate on the same scope (never a gate back-to-back), then converges', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Ward Red Recovery Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Ward Red Recovery Quest',
      userRequest: 'Build the feature',
      operations: [
        { id: FLOW_OP, role: 'flowrider', text: 'verify flows', status: 'in_progress' },
        {
          id: WARD_OP,
          role: 'ward',
          text: 'Ward gate (full monorepo)',
          status: 'pending',
          locked: true,
        },
      ],
      firstWorkItemId: FLOW_WORK_ITEM_ID,
      // `wardFull`'s `commit` step runs a real `git commit` in the quest's cwd, and with no
      // `worktreePath` recorded `questCwdResolveBroker` falls back to the repo root — the one
      // checkout nothing in a test may write to. The guild path is a throwaway directory of this
      // spec's own.
      worktreePath: GUILD_PATH,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Both PENDING for the same reason as the green case above: a row draws WORK-ITEM status, and
    // the dispatcher is paused in every e2e test, so a seeded work item has not run yet.
    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(
      ['PENDING', 'PENDING'],
      {
        timeout: PANEL_TIMEOUT,
      },
    );

    // All four outcomes are queued up front so no dispatched work item ever finds an empty queue
    // (an under-queued spawn would exit red-on-empty with no signal-back and churn orphan-recovery
    // to `blocked`). The relay is serial, so FIFO maps outcomes to dispatches:
    //   flowrider -> done
    //   gate#1    -> red    (routes `unmet` to `repair`)
    //   repair    -> done   (routes `done` to `commit`, which routes `done` back to `gate`)
    //   gate#2    -> green
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'flowrider', outcome: 'done' },
        { role: 'ward', outcome: 'red' },
        { role: 'spiritmender', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
      ],
    });

    // The recovery left the LEDGER untouched: still exactly the two seeded operation items, both
    // complete. Everything the red produced is a work item on the ward scope.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 2 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.length === 5,
    });

    expect(
      finalQuest.operations.map((op) => ({
        role: String(op.role),
        status: op.status,
      })),
    ).toStrictEqual([
      { role: 'flowrider', status: 'complete' },
      { role: 'ward', status: 'complete' },
    ]);

    // The step sequence IS the recovery, and position is the assertion: `repair` sits BETWEEN the
    // two `gate` items, so the loop never runs a gate back-to-back, and `commit` sits between the
    // repair and the fresh gate, so the fix the repair made is on the branch before the gate grades
    // it again. `toStrictEqual` on an array compares element-by-element, so the order is what is
    // being proved.
    expect(
      finalQuest.workItems.map((wi) => ({
        role: String(wi.role),
        step: wi.step === undefined ? null : String(wi.step),
      })),
    ).toStrictEqual([
      { role: 'flowrider', step: null },
      { role: 'ward', step: 'gate' },
      { role: 'ward', step: 'repair' },
      { role: 'ward', step: 'commit' },
      { role: 'ward', step: 'gate' },
    ]);

    // AFTER (UI): the list grew live to five rows — the flowrider, the red gate, the repair, its
    // commit, and the fresh gate that came back green.
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(
      ['DONE', 'DONE', 'DONE', 'DONE', 'DONE'],
      { timeout: LEDGER_TIMEOUT },
    );
    await expect(rows.getByTestId('execution-row-role-badge')).toHaveText([
      '[FLOWRIDER]',
      '[WARD]',
      '[WARD]',
      '[WARD]',
      '[WARD]',
    ]);
  });
});
