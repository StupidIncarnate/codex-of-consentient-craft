import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-operations-ward-recovery';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 25_000;
const LEDGER_TIMEOUT = 15_000;
const OPERATIONS_PREFIX = 'operations/';

// Fixed operation-item ids for the seeded ledger. The spiritmender + fresh-ward continuation ids
// are minted server-side (crypto.randomUUID), so the recovery ordering is proven against
// quest.operations, not pre-known ids.
const WARD_OP = '00000000-0000-4000-8000-0000000000a1';
const FLOW_OP = '00000000-0000-4000-8000-0000000000f1';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000010';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Ward as an operation (advance on green, spiritmender-first recovery on red)', () => {
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

  test('VALID: {ledger [ward(changed), flowrider] driven green/done/done} => ward completes and advances to the flowrider; no spiritmender inserted', async ({
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
        {
          id: WARD_OP,
          role: 'ward',
          text: 'ward (changed)',
          status: 'in_progress',
          locked: true,
          wardMode: 'changed',
        },
        { id: FLOW_OP, role: 'flowrider', text: 'verify flows', status: 'pending', locked: true },
      ],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
      // The advance target is driven to `done`, and signal-back refuses that while any verification
      // unit on the quest's runtime flows carries no `flowriderSignoff`. Seed the sign-offs a real
      // flowrider session writes before it signals, so the ward advance this spec is about is not
      // masked by a refusal on the item it advances TO.
      flowriderScopeSignedOff: true,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // BEFORE: ward in_progress ([>]), flowrider pending ([ ]); ward row carries its (changed) mode.
    const markers = page.getByTestId('OPERATIONS_LEDGER_ROW_MARKER');
    await expect(markers).toHaveText(['[>]', '[ ]'], { timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText([
      '[WARD]',
      '[FLOWRIDER]',
    ]);
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_WARD_MODE')).toHaveText('(changed)');

    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'ward', outcome: 'green' },
        { role: 'flowrider', outcome: 'done' },
        // flowrider is a committing role, so its `done` appends a blightscout review right after it.
        { role: 'blightscout', outcome: 'done' },
      ],
    });

    // A green ward marks its operation item complete and advances straight to the next pending
    // role (the flowrider). No spiritmender/fresh-ward pair is spliced (that is the red path only).
    // The flowrider is a committing role, so its `done` appends one blightscout review right after
    // it, and blightscout is not itself a committing role, so the chain stops there — the ledger
    // ends at exactly three items.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 3 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.length === 3 &&
        quest.workItems.every((wi) => wi.status === 'complete'),
    });

    expect(
      finalQuest.operations.map((op) => ({
        role: String(op.role),
        status: op.status,
        wardMode: op.wardMode ?? null,
      })),
    ).toStrictEqual([
      { role: 'ward', status: 'complete', wardMode: 'changed' },
      { role: 'flowrider', status: 'complete', wardMode: null },
      { role: 'blightscout', status: 'complete', wardMode: null },
    ]);

    // AFTER (UI): all three rows complete ([x]) — the seeded ward and flowrider rows, plus the
    // blightscout review the flowrider's completion appended; no spiritmender recovery pair
    // appeared.
    await expect(markers).toHaveText(['[x]', '[x]', '[x]'], { timeout: LEDGER_TIMEOUT });
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText([
      '[WARD]',
      '[FLOWRIDER]',
      '[BLIGHTSCOUT]',
    ]);
  });

  test('VALID: {ledger [ward(changed), flowrider] driven red/done/done/green/done/done} => red splices a spiritmender + fresh ward, dispatches the SPIRITMENDER next (never a ward back-to-back), then converges', async ({
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
        {
          id: WARD_OP,
          role: 'ward',
          text: 'ward (changed)',
          status: 'in_progress',
          locked: true,
          wardMode: 'changed',
        },
        { id: FLOW_OP, role: 'flowrider', text: 'verify flows', status: 'pending', locked: true },
      ],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
      // The tail item is driven to `done`, and signal-back refuses that while any verification unit
      // on the quest's runtime flows carries no `flowriderSignoff`. Seed the sign-offs a real
      // flowrider session writes before it signals, so the recovery ordering this spec is about is
      // not masked by a refusal on the item the chain converges to.
      flowriderScopeSignedOff: true,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const markers = page.getByTestId('OPERATIONS_LEDGER_ROW_MARKER');
    await expect(markers).toHaveText(['[>]', '[ ]'], { timeout: PANEL_TIMEOUT });

    // All six outcomes are queued up front so no dispatched work item ever finds an empty queue
    // (an under-queued spiritmender/blightscout spawn would exit red-on-empty with no signal-back
    // and churn orphan-recovery to `blocked`). The relay is serial, so FIFO maps outcomes to
    // dispatches. spiritmender and flowrider are committing roles, so each one's `done` appends a
    // blightscout review immediately after it, ahead of whatever was next in the ledger:
    //   ward#1 -> red         (splice spiritmender + fresh ward, advance to the spiritmender)
    //   spiritmender -> done  (appends a blightscout review right after it)
    //   blightscout#1 -> done (not a committing role, so nothing further is appended)
    //   ward#2 (fresh) -> green
    //   flowrider -> done     (appends a blightscout review right after it)
    //   blightscout#2 -> done
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'ward', outcome: 'red' },
        { role: 'spiritmender', outcome: 'done' },
        { role: 'blightscout', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
        { role: 'flowrider', outcome: 'done' },
        { role: 'blightscout', outcome: 'done' },
      ],
    });

    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 6 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.length === 6,
    });

    // The red ward marked its own operation complete, then spliced a spiritmender operation PLUS a
    // fresh ward continuation ("pt 2", same (changed) mode) immediately AFTER it — the spiritmender
    // sits BETWEEN the two ward items in ledger order, so the fixpoint never loops ward->ward.
    // Both the spiritmender and the flowrider are committing roles, so each one's completion
    // appends its own blightscout review immediately after it — the ledger ends at six items.
    expect(
      finalQuest.operations.map((op) => ({
        role: String(op.role),
        status: op.status,
        wardMode: op.wardMode ?? null,
      })),
    ).toStrictEqual([
      { role: 'ward', status: 'complete', wardMode: 'changed' },
      { role: 'spiritmender', status: 'complete', wardMode: null },
      { role: 'blightscout', status: 'complete', wardMode: null },
      { role: 'ward', status: 'complete', wardMode: 'changed' },
      { role: 'flowrider', status: 'complete', wardMode: null },
      { role: 'blightscout', status: 'complete', wardMode: null },
    ]);

    // Dispatch order (each work item ordered by its linked operation's ledger position) proves the
    // NEXT work item after the failed ward was the spiritmender — not another ward. The first ward
    // work item is `failed` (red); every later item ran and completed. Never two ward work items
    // back-to-back without a spiritmender between them, and each committing role's work item is
    // immediately followed by the blightscout review its completion appended.
    const opIndexById = new Map(finalQuest.operations.map((op, index) => [String(op.id), index]));
    const orderedWorkItems = finalQuest.workItems
      .map((wi) => {
        const ref = wi.relatedDataItems
          .map((r) => String(r))
          .find((r) => r.startsWith(OPERATIONS_PREFIX));
        return {
          role: String(wi.role),
          status: wi.status,
          index: opIndexById.get(String(ref).slice(OPERATIONS_PREFIX.length)) ?? -1,
        };
      })
      .sort((a, b) => a.index - b.index);
    expect(orderedWorkItems.map((wi) => ({ role: wi.role, status: wi.status }))).toStrictEqual([
      { role: 'ward', status: 'failed' },
      { role: 'spiritmender', status: 'complete' },
      { role: 'blightscout', status: 'complete' },
      { role: 'ward', status: 'complete' },
      { role: 'flowrider', status: 'complete' },
      { role: 'blightscout', status: 'complete' },
    ]);

    // AFTER (UI): the ledger grew live to six rows — ward, the spliced spiritmender, the
    // blightscout review it earned, the fresh ward, the flowrider, and the blightscout review the
    // flowrider earned — all complete ([x]); both ward rows keep their (changed) mode.
    await expect(markers).toHaveText(['[x]', '[x]', '[x]', '[x]', '[x]', '[x]'], {
      timeout: LEDGER_TIMEOUT,
    });
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText([
      '[WARD]',
      '[SPIRITMENDER]',
      '[BLIGHTSCOUT]',
      '[WARD]',
      '[FLOWRIDER]',
      '[BLIGHTSCOUT]',
    ]);
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_WARD_MODE')).toHaveText([
      '(changed)',
      '(changed)',
    ]);
  });
});
