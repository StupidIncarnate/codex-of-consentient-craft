import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-operations-driven-dispatch';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 30_000;
const LEDGER_TIMEOUT = 15_000;

// Fixed operation-item ids so the seed and the assertions reference the same ledger rows.
const CW1_OP = '00000000-0000-4000-8000-0000000000c1';
const CW2_OP = '00000000-0000-4000-8000-0000000000c2';
const WARD_OP = '00000000-0000-4000-8000-0000000000a1';
const FLOW_OP = '00000000-0000-4000-8000-0000000000f1';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000010';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Operations-driven dispatch', () => {
  // The full relay (7 serial dispatches: 6 fake-CLI children + 1 in-process ward — every
  // codeweaver/flowrider completion auto-appends a blightscout review right after it, ward does
  // not) plus the deadline-bounded poll runs past the 10s default per-test budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {ledger [cw, cw, ward(changed), flowrider] driven done/blightscout/done/blightscout/green/done/blightscout} => each operation completes in order, exactly one work item per operation, quest completes', async ({
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
      // The flowrider item is driven to `done`, and signal-back refuses that while any verification
      // unit on the quest's runtime flows carries no `flowriderSignoff`. Seed the sign-offs a real
      // flowrider session writes before it signals, so the ledger this spec is about is reached
      // through the same gate production reaches it through.
      flowriderScopeSignedOff: true,
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

    // Drive the relay: codeweaver -> done -> blightscout -> done, codeweaver -> done ->
    // blightscout -> done, ward -> green (ward is not a committing role, so no review follows it),
    // flowrider -> done -> blightscout -> done. Every committing role's completion (codeweaver,
    // flowrider) auto-appends a blightscout review immediately after it.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'codeweaver', outcome: 'done' },
        { role: 'blightscout', outcome: 'done' },
        { role: 'codeweaver', outcome: 'done' },
        { role: 'blightscout', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
        { role: 'flowrider', outcome: 'done' },
        { role: 'blightscout', outcome: 'done' },
      ],
    });

    // Backend truth (deadline-bounded poll): quest reaches complete, every operation item is
    // complete, and exactly seven work items exist and are all complete (strict 1:1, no
    // duplicates) — the four seeded items plus the three auto-appended blightscout reviews.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 7 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.length === 7 &&
        quest.workItems.every((wi) => wi.status === 'complete'),
    });

    // Operations stayed in the seeded order, with a blightscout review auto-appended immediately
    // after each committing item's completion (codeweaver, codeweaver, flowrider) — ward is not a
    // committing role, so no review follows it. No pt continuation was appended (that would mean a
    // partial) and no extra ward/spiritmender pair (that would mean a red).
    expect(
      finalQuest.operations.map((op) => ({ role: String(op.role), status: op.status })),
    ).toStrictEqual([
      { role: 'codeweaver', status: 'complete' },
      { role: 'blightscout', status: 'complete' },
      { role: 'codeweaver', status: 'complete' },
      { role: 'blightscout', status: 'complete' },
      { role: 'ward', status: 'complete' },
      { role: 'flowrider', status: 'complete' },
      { role: 'blightscout', status: 'complete' },
    ]);

    // Strict 1:1: exactly seven work items, each linked to a DISTINCT operation item. Three of the
    // seven operation ids (the auto-appended blightscout reviews) are minted server-side, so
    // compare against the quest's own operations list rather than the seeded id constants — that
    // still proves strict 1:1 across the WHOLE ledger, which is what this test claims.
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

    // AFTER (UI): the old markers are gone; all seven ledger rows read complete ([x]), in the
    // order codeweaver, blightscout, codeweaver, blightscout, ward, flowrider, blightscout.
    await expect(markers).toHaveText(['[x]', '[x]', '[x]', '[x]', '[x]', '[x]', '[x]'], {
      timeout: LEDGER_TIMEOUT,
    });
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText([
      '[CODEWEAVER]',
      '[BLIGHTSCOUT]',
      '[CODEWEAVER]',
      '[BLIGHTSCOUT]',
      '[WARD]',
      '[FLOWRIDER]',
      '[BLIGHTSCOUT]',
    ]);
  });
});
