import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-dispatch-mcp-down-walls-session';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 20_000;

const OP_ID = '00000000-0000-4000-8000-0000000000b1';
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'e2e00000-0000-4000-8000-000000000031' });

// The init line the CLI wrote in quest 1918a5ee's worktree, whose MCP entry crashed at load: the
// session had no get-agent-prompt, quest-work or signal-back tool, and could say so only in prose.
const MCP_FAILED_INIT_LINE = JSON.stringify({
  type: 'system',
  subtype: 'init',
  session_id: 'e2e-mcp-down-session',
  mcp_servers: [
    { name: 'webstorm', status: 'connected', source: 'user' },
    { name: 'dungeonmaster', status: 'failed', source: 'project' },
  ],
});

const WALL_REASON =
  "the dungeonmaster MCP server did not connect in this session (status: failed), so it had no get-agent-prompt, quest-work or signal-back tool — run the server's command from .mcp.json by hand in this session's working directory to see why it fails";

// What the row shows once the router blocks: the wall's own reason first, then the router's halt line.
const BLOCK_MESSAGE = `${WALL_REASON} — step \`work\` in family \`codeweaver\` folded to \`wall\` and routes it to \`@blocked\` for operation item ${OP_ID}. No fresh session of any role passes this, so the quest halts here for a human.`;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('A session whose dungeonmaster MCP server failed is walled, not resumed', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {init line reports dungeonmaster failed} => one spawn, the quest blocks, and the expanded row shows the MCP reason', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'MCP Down Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const { questId } = await dispatch.seedQuest({
      guildId: GuildIdStub({ value: String(guild.id) }),
      title: 'MCP Down Quest',
      userRequest: 'Build the feature',
      operations: [
        {
          id: OP_ID,
          role: 'codeweaver',
          step: 'work',
          text: 'codeweaver — package: web · flow: send-flow',
          status: 'in_progress',
        },
      ],
      firstWorkItemId: WORK_ITEM_ID,
    });

    await nav.navigateToQuest({ urlSlug, questId });
    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // One scripted child, and a spare queued behind it: a resume would consume the spare, so the
    // invocation count below proves the orchestrator never resumed the walled session.
    await dispatch.playAndDrive({
      questId,
      script: [
        { role: 'codeweaver', outcome: 'silent', outputLines: [MCP_FAILED_INIT_LINE] },
        { role: 'codeweaver', outcome: 'done' },
      ],
    });

    const blocked = await dispatch.waitForQuest({
      questId,
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) => quest.status === 'blocked',
    });

    expect({
      status: blocked.status,
      workItem: blocked.workItems
        .filter((wi) => String(wi.id) === String(WORK_ITEM_ID))
        .map((wi) => ({
          status: wi.status,
          declaredWord: wi.declaredWord,
          errorMessage: String(wi.errorMessage),
        })),
      spawns: dispatch.readClaudeInvocations().length,
    }).toStrictEqual({
      status: 'blocked',
      workItem: [{ status: 'failed', declaredWord: 'wall', errorMessage: BLOCK_MESSAGE }],
      spawns: 1,
    });

    // THE VERDICT is the browser: the failed row, expanded, tells the reader why the quest halted.
    const failedRow = executionPanel
      .locator('[data-testid="execution-row-header"]')
      .filter({ hasText: 'CODEWEAVER' })
      .first();
    await expect(failedRow).toBeVisible({ timeout: PANEL_TIMEOUT });
    await failedRow.click();

    await expect(executionPanel.getByTestId('execution-row-error-message')).toHaveText(
      `Error: ${BLOCK_MESSAGE}`,
      { timeout: PANEL_TIMEOUT },
    );
  });
});
