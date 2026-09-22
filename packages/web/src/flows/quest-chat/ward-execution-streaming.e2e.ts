import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-ward-execution-streaming';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 25_000;
const WARD_OUTPUT_TIMEOUT = 15_000;

const CW_OP = '00000000-0000-4000-8000-0000000000c1';
const WARD_OP = '00000000-0000-4000-8000-0000000000a1';
const CW_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000010';

const FLOW_CW_OP = '00000000-0000-4000-8000-0000000000c2';
const FLOW_OP = '00000000-0000-4000-8000-0000000000f2';
const FLOW_WARD_OP = '00000000-0000-4000-8000-0000000000a2';
const FLOW_CW_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000020';
const FLOW_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000021';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// THE WARD GATE IS THE LEDGER'S LAST SCOPE (`wardFull` is the only family whose edge reaches
// `@complete`), and `questRunWardBroker` — the Node dispatch loop's `run-ward` handler — answers its
// work item directly with a REQUIRED `onLine` callback: a command work item carries no sessionId, so
// no JSONL watcher can tail it, and that callback is the ONLY route its output ever has to a UI (see
// that broker's header). This spec proves the callback's output actually lands in the execution
// panel. `operations-ward-recovery.e2e.ts` already proves the gate's status transitions and its
// repair loop end to end, so this spec asserts none of that again — only the streamed TEXT.
test.describe('Ward Execution Streaming', () => {
  // Drives the real relay (fake-CLI children + an in-process ward run) past the 10s default budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {ledger [codeweaver, ward(full)] driven done/green} => ward streams its output lines into the execution panel', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Ward Streaming Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Ward Streaming Quest',
      userRequest: 'Test ward streaming',
      operations: [
        { id: CW_OP, role: 'codeweaver', text: 'core: build the feature', status: 'in_progress' },
        {
          id: WARD_OP,
          role: 'ward',
          text: 'Ward gate (full monorepo)',
          status: 'pending',
          locked: true,
        },
      ],
      firstWorkItemId: CW_WORK_ITEM_ID,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Drive the relay: codeweaver -> done, then the ward gate -> green with real stdout lines.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'codeweaver', outcome: 'done' },
        {
          role: 'ward',
          outcome: 'green',
          outputLines: [
            'lint        @dungeonmaster/shared PASS  42 files',
            'typecheck   @dungeonmaster/shared PASS',
            'unit        @dungeonmaster/shared PASS  15 tests passed',
          ],
        },
      ],
    });

    await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) => quest.status === 'complete',
    });

    // Wait for the ward row to reach DONE before clicking. Required because the row is not
    // expandable while status is `pending` or `in_progress` — a click during that window is a
    // no-op, and the row's auto-expand/auto-collapse lifecycle can leave the row collapsed by the
    // time entries arrive. Filtering on `[WARD]` + `DONE` ensures the click lands on a row the
    // widget will actually toggle open.
    const wardRow = executionPanel
      .locator('[data-testid="execution-row-header"]')
      .filter({ hasText: '[WARD]' })
      .filter({ hasText: 'DONE' })
      .first();

    await expect(wardRow).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });
    await wardRow.click();

    // A DONE row opens on its whole transcript — the tail window only holds while the item is
    // running — so the ward output is on screen without touching the "Show N earlier" toggle. Scope
    // to the execution panel because the activity panel also flattens session entries and renders
    // the same text, which would otherwise trip Playwright's strict-mode duplicate match.
    await expect(
      executionPanel.getByText('lint        @dungeonmaster/shared PASS  42 files'),
    ).toBeVisible({
      timeout: WARD_OUTPUT_TIMEOUT,
    });
    await expect(
      executionPanel.getByText('unit        @dungeonmaster/shared PASS  15 tests passed'),
    ).toBeVisible({
      timeout: WARD_OUTPUT_TIMEOUT,
    });
  });

  test('VALID: {ledger [codeweaver, flowrider, ward(full)] driven done/done/green} => ward still streams its output lines after a longer relay', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Ward Streaming Longer Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Ward Streaming Longer Quest',
      userRequest: 'Test ward streaming',
      operations: [
        {
          id: FLOW_CW_OP,
          role: 'codeweaver',
          text: 'core: build the feature',
          status: 'in_progress',
        },
        {
          id: FLOW_OP,
          role: 'flowrider',
          text: 'verify flows',
          status: 'pending',
          workItemId: FLOW_WORK_ITEM_ID,
        },
        {
          id: FLOW_WARD_OP,
          role: 'ward',
          text: 'Ward gate (full monorepo)',
          status: 'pending',
          locked: true,
        },
      ],
      firstWorkItemId: FLOW_CW_WORK_ITEM_ID,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'codeweaver', outcome: 'done' },
        { role: 'flowrider', outcome: 'done' },
        {
          role: 'ward',
          outcome: 'green',
          outputLines: [
            'lint        @dungeonmaster/orchestrator PASS  128 files',
            'typecheck   @dungeonmaster/orchestrator PASS',
            'unit        @dungeonmaster/orchestrator PASS  87 tests passed',
            'integration @dungeonmaster/orchestrator PASS  12 tests passed',
          ],
        },
      ],
    });

    await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) => quest.status === 'complete',
    });

    const wardRow = executionPanel
      .locator('[data-testid="execution-row-header"]')
      .filter({ hasText: '[WARD]' })
      .filter({ hasText: 'DONE' })
      .first();

    await expect(wardRow).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });
    await wardRow.click();

    await expect(
      executionPanel.getByText('lint        @dungeonmaster/orchestrator PASS  128 files'),
    ).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });
    await expect(
      executionPanel.getByText('integration @dungeonmaster/orchestrator PASS  12 tests passed'),
    ).toBeVisible({ timeout: WARD_OUTPUT_TIMEOUT });
  });
});
