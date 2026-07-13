import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-operations-driven-dispatch';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 20_000;
const LEDGER_TIMEOUT = 15_000;

// Fixed operation-item ids so the seed and the assertions reference the same ledger rows.
const CW1_OP = '00000000-0000-4000-8000-0000000000c1';
const CW2_OP = '00000000-0000-4000-8000-0000000000c2';
const WARD_OP = '00000000-0000-4000-8000-0000000000a1';
const FLOW_OP = '00000000-0000-4000-8000-0000000000f1';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000010';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

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

  test('VALID: {ledger [cw, cw, ward(changed), flowrider] driven done/done/green/done} => each operation completes in order, exactly one work item per operation, quest completes', async ({
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

    // Seed a quest in_progress with the ordered ledger + ONE work item linked 1:1 to the first
    // (in_progress) operation item. The dispatcher is paused (beforeEach), so nothing runs yet.
    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Operations Dispatch Quest',
      userRequest: 'Build the feature',
      operations: [
        { id: CW1_OP, role: 'codeweaver', text: 'core: config adapter', status: 'in_progress' },
        { id: CW2_OP, role: 'codeweaver', text: 'core: config broker', status: 'pending' },
        {
          id: WARD_OP,
          role: 'ward',
          text: 'ward (changed)',
          status: 'pending',
          locked: true,
          wardMode: 'changed',
        },
        { id: FLOW_OP, role: 'flowrider', text: 'verify flows', status: 'pending', locked: true },
      ],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // BEFORE: the seeded ledger — first row in_progress ([>]), the rest pending ([ ]).
    const markers = page.getByTestId('OPERATIONS_LEDGER_ROW_MARKER');
    await expect(markers).toHaveText(['[>]', '[ ]', '[ ]', '[ ]'], { timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText([
      '[CODEWEAVER]',
      '[CODEWEAVER]',
      '[WARD]',
      '[FLOWRIDER]',
    ]);
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_WARD_MODE')).toHaveText('(changed)');

    // Drive the relay: codeweaver -> done, codeweaver -> done, ward -> green, flowrider -> done.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'codeweaver', outcome: 'done' },
        { role: 'codeweaver', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
        { role: 'flowrider', outcome: 'done' },
      ],
    });

    // Backend truth (deadline-bounded poll): quest reaches complete, every operation item is
    // complete, and exactly four work items exist and are all complete (strict 1:1, no duplicates).
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

    // Operations stayed in the seeded order, all complete — no pt continuation was appended (that
    // would mean a partial) and no extra ward/spiritmender pair (that would mean a red).
    expect(
      finalQuest.operations.map((op) => ({ role: String(op.role), status: op.status })),
    ).toStrictEqual([
      { role: 'codeweaver', status: 'complete' },
      { role: 'codeweaver', status: 'complete' },
      { role: 'ward', status: 'complete' },
      { role: 'flowrider', status: 'complete' },
    ]);

    // Strict 1:1: exactly four work items, each linked to a DISTINCT operation item.
    const linkedOperationRefs = finalQuest.workItems
      .map((wi) =>
        wi.relatedDataItems.map((ref) => String(ref)).find((ref) => ref.startsWith('operations/')),
      )
      .sort((a, b) => String(a).localeCompare(String(b)));
    expect(linkedOperationRefs).toStrictEqual(
      [CW1_OP, CW2_OP, WARD_OP, FLOW_OP]
        .map((id) => `operations/${id}`)
        .sort((a, b) => a.localeCompare(b)),
    );

    // AFTER (UI): the old markers are gone; all four ledger rows read complete ([x]).
    await expect(markers).toHaveText(['[x]', '[x]', '[x]', '[x]'], { timeout: LEDGER_TIMEOUT });
  });
});
