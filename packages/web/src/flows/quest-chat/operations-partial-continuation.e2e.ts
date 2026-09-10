import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-operations-partial-continuation';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 20_000;
const LEDGER_TIMEOUT = 15_000;

// Fixed operation-item id so the seed and the assertions reference the same ledger row. The pt
// continuation's id is minted server-side (crypto.randomUUID), so 1:1 linkage is proven by set
// equality against quest.operations rather than pre-known ids.
const CW1_OP = '00000000-0000-4000-8000-0000000000c1';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000010';
const BASE_TEXT = 'core: config adapter';
const PT2_TEXT = 'pt 2: core: config adapter';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Operations duplicate-on-partial (pt-N continuation)', () => {
  // The two serial dispatches (the partial, then the pt 2 continuation) plus the deadline-bounded
  // poll run past the 10s default per-test budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {ledger [codeweaver] driven partial/done} => original completes, a "pt 2:" continuation lands directly after it, a SECOND codeweaver work item runs it, quest converges', async ({
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

    // Seed a quest in_progress with a single codeweaver operation + ONE work item linked 1:1 to it.
    // The dispatcher is paused (beforeEach), so nothing runs until playAndDrive.
    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Partial Continuation Quest',
      userRequest: 'Build the feature',
      operations: [{ id: CW1_OP, role: 'codeweaver', text: BASE_TEXT, status: 'in_progress' }],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // BEFORE: exactly ONE row — the work item minted for the seeded codeweaver operation, named by
    // that operation's text. Nothing is unclaimed, so the list has no pending tail.
    //
    // It reads PENDING, not RUNNING, and that is the difference from the ledger box this replaced.
    // The box drew OPERATION status, which flips to `in_progress` when a work item is minted; a
    // row draws WORK-ITEM status, which stays `pending` until something dispatches it, and every
    // e2e test pauses the dispatcher.
    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(['PENDING'], {
      timeout: PANEL_TIMEOUT,
    });
    await expect(rows.getByTestId('execution-row-role-badge')).toHaveText(['[CODEWEAVER]']);
    await expect(rows.filter({ hasText: BASE_TEXT })).toHaveCount(1);

    // Drive the relay: codeweaver -> partial (appends the pt continuation directly after the
    // completed item), then codeweaver pt 2 -> done.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'codeweaver', outcome: 'partial' },
        { role: 'codeweaver', outcome: 'done' },
      ],
    });

    // Backend truth (deadline-bounded poll): the quest converges, exactly TWO operation items
    // exist and both are complete (the original codeweaver item and its pt continuation), exactly
    // two work items ran them, and both are codeweaver (strict 1:1 — the partial did not mint a
    // duplicate on the same operation, and the continuation got its own fresh work item).
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 2 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.length === 2 &&
        quest.workItems.filter((wi) => String(wi.role) === 'codeweaver').length === 2 &&
        quest.workItems.every((wi) => wi.status === 'complete'),
    });

    // The original operation completed, and the "pt 2: {base}" continuation landed IMMEDIATELY
    // after it with nothing in between.
    expect(
      finalQuest.operations.map((op) => ({ role: String(op.role), status: op.status })),
    ).toStrictEqual([
      { role: 'codeweaver', status: 'complete' },
      { role: 'codeweaver', status: 'complete' },
    ]);

    // The duplicate-on-partial audit trail: the rows, in order, carry the base text then its
    // "pt 2:" continuation.
    expect(
      finalQuest.operations
        .filter((op) => String(op.role) === 'codeweaver')
        .map((op) => String(op.text)),
    ).toStrictEqual([BASE_TEXT, PT2_TEXT]);

    // Strict 1:1: exactly two work items — codeweaver, codeweaver, in dispatch order — each linked
    // to a DISTINCT operation item (the pt continuation's id was minted server-side).
    expect(finalQuest.workItems.map((wi) => String(wi.role))).toStrictEqual([
      'codeweaver',
      'codeweaver',
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

    // AFTER (UI): the list now shows BOTH work-item rows — the original and the one running its
    // pt-2 continuation — DONE, and the pt-2 audit trail reads on the row that ran it.
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(['DONE', 'DONE'], {
      timeout: LEDGER_TIMEOUT,
    });
    await expect(rows.getByTestId('execution-row-role-badge')).toHaveText([
      '[CODEWEAVER]',
      '[CODEWEAVER]',
    ]);
    await expect(rows.filter({ hasText: PT2_TEXT })).toHaveCount(1);
  });
});
