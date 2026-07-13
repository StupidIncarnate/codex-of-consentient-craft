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

  test('VALID: {ledger [ward(changed), flowrider] driven green/done} => ward completes and advances to the flowrider; no spiritmender inserted', async ({
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
      ],
    });

    // A green ward marks its operation item complete and advances straight to the next pending
    // role (the flowrider). No spiritmender/fresh-ward pair is spliced (that is the red path only),
    // so the ledger stays exactly two items.
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
        wardMode: op.wardMode ?? null,
      })),
    ).toStrictEqual([
      { role: 'ward', status: 'complete', wardMode: 'changed' },
      { role: 'flowrider', status: 'complete', wardMode: null },
    ]);

    // AFTER (UI): both rows complete ([x]); still exactly two rows — no recovery pair appeared.
    await expect(markers).toHaveText(['[x]', '[x]'], { timeout: LEDGER_TIMEOUT });
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText([
      '[WARD]',
      '[FLOWRIDER]',
    ]);
  });

  test('VALID: {ledger [ward(changed), flowrider] driven red/done/green/done} => red splices a spiritmender + fresh ward, dispatches the SPIRITMENDER next (never a ward back-to-back), then converges', async ({
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
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const markers = page.getByTestId('OPERATIONS_LEDGER_ROW_MARKER');
    await expect(markers).toHaveText(['[>]', '[ ]'], { timeout: PANEL_TIMEOUT });

    // All four outcomes are queued up front so no dispatched work item ever finds an empty queue
    // (an under-queued spiritmender spawn would exit red-on-empty with no signal-back and churn
    // orphan-recovery to `blocked`). The relay is serial, so FIFO maps outcomes to dispatches:
    //   ward#1 -> red   (splice spiritmender + fresh ward, advance to the spiritmender)
    //   spiritmender -> done
    //   ward#2 (fresh) -> green
    //   flowrider -> done
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'ward', outcome: 'red' },
        { role: 'spiritmender', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
        { role: 'flowrider', outcome: 'done' },
      ],
    });

    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 4 &&
        quest.operations.every((op) => op.status === 'complete') &&
        quest.workItems.length === 4,
    });

    // The red ward marked its own operation complete, then spliced a spiritmender operation PLUS a
    // fresh ward continuation ("pt 2", same (changed) mode) immediately AFTER it — the spiritmender
    // sits BETWEEN the two ward items in ledger order, so the fixpoint never loops ward->ward.
    expect(
      finalQuest.operations.map((op) => ({
        role: String(op.role),
        status: op.status,
        wardMode: op.wardMode ?? null,
      })),
    ).toStrictEqual([
      { role: 'ward', status: 'complete', wardMode: 'changed' },
      { role: 'spiritmender', status: 'complete', wardMode: null },
      { role: 'ward', status: 'complete', wardMode: 'changed' },
      { role: 'flowrider', status: 'complete', wardMode: null },
    ]);

    // Dispatch order (each work item ordered by its linked operation's ledger position) proves the
    // NEXT work item after the failed ward was the spiritmender — not another ward. The first ward
    // work item is `failed` (red); every later item ran and completed. Never two ward work items
    // back-to-back without a spiritmender between them.
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
      { role: 'ward', status: 'complete' },
      { role: 'flowrider', status: 'complete' },
    ]);

    // AFTER (UI): the ledger grew live to four rows — ward, the spliced spiritmender, the fresh
    // ward, then the flowrider — all complete ([x]); both ward rows keep their (changed) mode.
    await expect(markers).toHaveText(['[x]', '[x]', '[x]', '[x]'], { timeout: LEDGER_TIMEOUT });
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_ROLE')).toHaveText([
      '[WARD]',
      '[SPIRITMENDER]',
      '[WARD]',
      '[FLOWRIDER]',
    ]);
    await expect(page.getByTestId('OPERATIONS_LEDGER_ROW_WARD_MODE')).toHaveText([
      '(changed)',
      '(changed)',
    ]);
  });
});
