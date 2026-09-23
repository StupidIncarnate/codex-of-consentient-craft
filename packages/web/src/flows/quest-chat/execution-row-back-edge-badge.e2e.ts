import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-execution-row-back-edge-badge';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 25_000;
const LEDGER_TIMEOUT = 15_000;

const CODEWEAVER_OP = '00000000-0000-4000-8000-0000000000d1';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000030';
const OPERATION_TEXT = 'Build login broker — package: auth-service · flow: harness-flow';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// `agentFlowStatics`' shared `CLOSE_OUT` block gives codeweaver its `ward`/`repair` pair: a red
// `ward` routes `unmet` to `repair`, and `repair` declares NO `done` route of its own, so a
// finished repair returns to the gate that minted it (the gate/repair fixpoint) as a FRESH `ward`
// work item rather than resuming the old one. `nextActionTransformer` stamps the fresh ward's own
// `mintedBy` by copying the ORIGINAL gate's `mintedBy` (undefined here, since this scope's ward is
// the family's own entry step) rather than minting a new edge — so only the repair row, minted
// directly off the red gate, ever carries a back-edge badge.
test.describe('Execution row back-edge badge: codeweaver ward red -> repair -> fresh ward', () => {
  // The full relay (a real in-process ward run for the deterministic step, plus a fake-CLI child
  // for the repair) plus the deadline-bounded poll runs past the 10s default per-test budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {codeweaver ward red -> repair done -> ward green} => only the repair row carries a back-edge badge, naming the row it returns to', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Back-Edge Badge Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Back-Edge Badge Quest',
      userRequest: 'Build the feature',
      operations: [
        {
          id: CODEWEAVER_OP,
          role: 'codeweaver',
          text: OPERATION_TEXT,
          status: 'in_progress',
          step: 'ward',
        },
      ],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
      worktreePath: GUILD_PATH,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const rows = executionPanel.getByTestId('execution-row-layer-widget');

    // BEFORE: the scope holds one visible work item, so it stays BARE (decision 2) — one row, named
    // by the operation's own text, no back-edge badge yet, nothing dispatched (every e2e test pauses
    // the dispatcher).
    await expect(rows).toHaveCount(1, { timeout: PANEL_TIMEOUT });
    await expect(
      rows.filter({
        has: page.getByTestId('execution-row-name').getByText(OPERATION_TEXT, { exact: true }),
      }),
    ).toHaveCount(1);
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText('PENDING', {
      timeout: PANEL_TIMEOUT,
    });
    await expect(executionPanel.getByTestId('execution-row-minted-by-badge')).toHaveCount(0);
    await expect(executionPanel.getByTestId('execution-status-bar-layer-widget')).toHaveText(
      'EXECUTION0/1 STEPS',
    );

    // FIFO maps outcomes to dispatches: `ward` (a deterministic step, so it runs through the ward
    // mock) -> red, routing `unmet` to `repair`; `repair` (a `spiritmender` worker, an agent
    // dispatch) -> done, returning to a FRESH `ward`; that fresh `ward` -> green, completing the
    // scope.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'ward', outcome: 'red' },
        { role: 'spiritmender', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
      ],
    });

    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.workItems.length === 3 && quest.workItems.every((wi) => wi.status === 'complete'),
    });

    // The recovery loop stayed on THIS scope — no operation item was spliced, and the router never
    // ran a gate back-to-back: `repair` sits between the two `ward` items.
    expect(
      finalQuest.workItems.map((wi) => (wi.step === undefined ? null : String(wi.step))),
    ).toStrictEqual(['ward', 'repair', 'ward']);

    // Stop here, before the codeweaver family's own drain mints the next family's scopes — driving
    // that mint would dispatch against a queue this spec never loads.
    await dispatch.afterEach();

    // AFTER: the scope now holds three work items, so it grows an operation HEADER (role badge only
    // — every child row is indented and drops its own [ROLE] badge) plus one nested row per step:
    // `ward pt: 1`, `repair`, `ward pt: 2` (the panel's own tiering — two same-step items with no
    // `pieceId` are numbered in array order).
    await expect(rows).toHaveCount(4, { timeout: LEDGER_TIMEOUT });
    await expect(
      rows
        .filter({
          has: page.getByTestId('execution-row-name').getByText(OPERATION_TEXT, { exact: true }),
        })
        .getByTestId('execution-row-role-badge'),
    ).toHaveText('[CODEWEAVER]');

    const wardPt1Row = rows.filter({
      has: page.getByTestId('execution-row-name').getByText('ward pt: 1', { exact: true }),
    });
    const repairRow = rows.filter({
      has: page.getByTestId('execution-row-name').getByText('repair', { exact: true }),
    });
    const wardPt2Row = rows.filter({
      has: page.getByTestId('execution-row-name').getByText('ward pt: 2', { exact: true }),
    });

    await expect(wardPt1Row.getByTestId('execution-row-status-badge')).toHaveText('DONE');
    await expect(repairRow.getByTestId('execution-row-status-badge')).toHaveText('DONE');
    await expect(wardPt2Row.getByTestId('execution-row-status-badge')).toHaveText('DONE');

    // Only the repair row carries a badge, and it names the ROW LABEL of the gate that minted it —
    // never the raw id.
    await expect(wardPt1Row.getByTestId('execution-row-minted-by-badge')).toHaveCount(0);
    await expect(wardPt2Row.getByTestId('execution-row-minted-by-badge')).toHaveCount(0);
    await expect(repairRow.getByTestId('execution-row-minted-by-badge')).toHaveText(
      '↩ ward pt: 1',
    );
  });
});
