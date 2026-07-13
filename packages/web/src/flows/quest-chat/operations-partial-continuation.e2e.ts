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
// equality against quest.operations rather than a pre-known id.
const CW1_OP = '00000000-0000-4000-8000-0000000000c1';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000010';
const BASE_TEXT = 'core: config adapter';
const PT2_TEXT = 'pt 2: core: config adapter';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Operations duplicate-on-partial (pt-N continuation)', () => {
  // The two serial dispatches (partial then done) plus the deadline-bounded poll run past the 10s
  // default per-test budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {ledger [codeweaver] driven partial/done} => original completes, a "pt 2:" continuation is appended, a SECOND codeweaver work item runs it, quest converges', async ({
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

    // BEFORE: exactly ONE ledger row — the seeded codeweaver operation, in_progress ([>]).
    const markers = page.getByTestId('OPERATIONS_LEDGER_ROW_MARKER');
    await expect(markers).toHaveText(['[>]'], { timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText(['[CODEWEAVER]']);
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_TEXT')).toHaveText([BASE_TEXT]);

    // Drive the relay: codeweaver -> partial (spawns the pt continuation), codeweaver -> done.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'codeweaver', outcome: 'partial' },
        { role: 'codeweaver', outcome: 'done' },
      ],
    });

    // Backend truth (deadline-bounded poll): the quest converges, exactly TWO operation items exist
    // and both are complete (the original + the appended pt continuation), and EXACTLY two
    // codeweaver work items ran them (strict 1:1 — the partial did not mint a duplicate on the same
    // operation, and the continuation got its own fresh work item).
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 2 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.filter((wi) => String(wi.role) === 'codeweaver').length === 2 &&
        quest.workItems.every((wi) => wi.status === 'complete'),
    });

    // The original operation completed and a "pt 2: {base}" continuation (same codeweaver role) was
    // appended immediately after it — the duplicate-on-partial audit trail.
    expect(
      finalQuest.operations.map((op) => ({
        role: String(op.role),
        status: op.status,
        text: String(op.text),
      })),
    ).toStrictEqual([
      { role: 'codeweaver', status: 'complete', text: BASE_TEXT },
      { role: 'codeweaver', status: 'complete', text: PT2_TEXT },
    ]);

    // Strict 1:1: exactly two work items, both codeweaver, each linked to a DISTINCT operation item
    // (the two operation ids, one of which — the pt continuation — was minted server-side).
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

    // AFTER (UI): the single seeded row is gone; the ledger now shows BOTH the original row and the
    // pt-2 continuation row, both complete ([x]).
    await expect(markers).toHaveText(['[x]', '[x]'], { timeout: LEDGER_TIMEOUT });
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText([
      '[CODEWEAVER]',
      '[CODEWEAVER]',
    ]);
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_TEXT')).toHaveText([BASE_TEXT, PT2_TEXT]);
  });
});
