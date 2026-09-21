import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-operations-partial-continuation';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 25_000;
const LEDGER_TIMEOUT = 15_000;

// Fixed operation-item id so the seed and the assertions reference the same ledger row. The
// spiritmender and pt-2 ids are minted server-side (crypto.randomUUID), so 1:1 linkage is proven by
// set equality against quest.operations rather than pre-known ids.
const WARD_OP = '00000000-0000-4000-8000-0000000000a1';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000010';
const BASE_TEXT = 'Ward gate (full monorepo)';
const PT2_TEXT = 'pt 2: Ward gate (full monorepo)';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// A CONTINUATION IS A NEW LEDGER ROW, NEVER A RE-OPENED ONE, and the outcome that mints one is an
// EXIT CODE. An agent session cannot ask for one: `signal-back` is a session-terminal marker whose
// two input contracts are `.strict()` and carry no outcome word, and of the four words a session
// records through `quest-work`, `unmet` spends itself on a successor scoped to its own units rather
// than on a fresh scope. A COMMAND role is the exception — ward's verdict is its exit code — so the
// red ward is the caller that still reaches the `pt N` machinery.
test.describe('Operations duplicate-on-red (pt-N continuation)', () => {
  // The three serial dispatches (the red ward, the spiritmender, the pt 2 ward) plus the
  // deadline-bounded poll run past the 10s default per-test budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {ledger [ward] driven red/done/green} => the red ward completes and is never re-opened, a "pt 2:" continuation carrying its text and lock is appended, a SECOND ward work item runs it, quest converges', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Partial Continuation Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Seed a quest in_progress with a single ward operation + ONE work item linked 1:1 to it.
    // The dispatcher is paused (beforeEach), so nothing runs until playAndDrive.
    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Partial Continuation Quest',
      userRequest: 'Build the feature',
      operations: [
        { id: WARD_OP, role: 'ward', text: BASE_TEXT, status: 'in_progress', locked: true },
      ],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // BEFORE: exactly ONE row — the work item minted for the seeded ward operation, named by that
    // operation's text. Nothing is unclaimed, so the list has no pending tail.
    //
    // It reads PENDING, not RUNNING: a row draws WORK-ITEM status, which stays `pending` until
    // something dispatches it, and every e2e test pauses the dispatcher.
    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(['PENDING'], {
      timeout: PANEL_TIMEOUT,
    });
    await expect(rows.getByTestId('execution-row-role-badge')).toHaveText(['[WARD]']);
    await expect(rows.filter({ hasText: BASE_TEXT })).toHaveCount(1);

    // Drive the relay: ward -> red (appends the spiritmender and the pt continuation after the
    // completed item), spiritmender -> done, then the pt 2 ward -> green.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'ward', outcome: 'red' },
        { role: 'spiritmender', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
      ],
    });

    // Backend truth (deadline-bounded poll): the quest converges, exactly THREE operation items
    // exist and all are complete (the original ward, its spiritmender, and its pt continuation),
    // and exactly three work items ran them — strict 1:1, so the red did not mint a duplicate work
    // item on the same operation and the continuation got its own fresh one.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 3 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.length === 3,
    });

    // The original operation completed — the red never reverted it to pending — and the
    // continuation landed AFTER the spiritmender that repairs it, so the chain never loops
    // ward->ward. `toStrictEqual` compares element-by-element, so the position IS the assertion.
    expect(
      finalQuest.operations.map((op) => ({ role: String(op.role), status: op.status })),
    ).toStrictEqual([
      { role: 'ward', status: 'complete' },
      { role: 'spiritmender', status: 'complete' },
      { role: 'ward', status: 'complete' },
    ]);

    // The duplicate-on-red audit trail: the two WARD rows, in order, carry the base text then its
    // "pt 2:" continuation — the continuation inherits the text it re-verifies rather than being
    // named afresh, which is what makes the chain readable on the ledger.
    expect(
      finalQuest.operations.filter((op) => String(op.role) === 'ward').map((op) => String(op.text)),
    ).toStrictEqual([BASE_TEXT, PT2_TEXT]);

    // The continuation carries the lock the item it continues carried: `locked` enrols a scope in
    // its role's pt budget, so a continuation that lost it would leave the chain unbounded.
    expect(finalQuest.operations.map((op) => op.locked)).toStrictEqual([true, true, true]);

    // Strict 1:1: three work items — ward, spiritmender, ward, in dispatch order — each linked to a
    // DISTINCT operation item (the spiritmender's and the continuation's ids were minted
    // server-side). The first ward is `failed`, carrying the red; the two after it ran and
    // completed.
    expect(
      finalQuest.workItems.map((wi) => ({ role: String(wi.role), status: wi.status })),
    ).toStrictEqual([
      { role: 'ward', status: 'failed' },
      { role: 'spiritmender', status: 'complete' },
      { role: 'ward', status: 'complete' },
    ]);
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

    // AFTER (UI): the list grew live to three rows — the red ward, its spiritmender, and the work
    // item running the pt-2 continuation — and the pt-2 audit trail reads on the row that ran it.
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(
      ['FAILED', 'DONE', 'DONE'],
      { timeout: LEDGER_TIMEOUT },
    );
    await expect(rows.getByTestId('execution-row-role-badge')).toHaveText([
      '[WARD]',
      '[SPIRITMENDER]',
      '[WARD]',
    ]);
    await expect(rows.filter({ hasText: PT2_TEXT })).toHaveCount(1);
  });
});
