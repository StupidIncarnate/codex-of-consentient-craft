import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-role-transition-streams-live';
const PANEL_TIMEOUT = 10_000;
const DISPATCH_TIMEOUT = 30_000;
const STREAM_TIMEOUT = 30_000;

const WORKTREE_NAME = 'role-transition-streams-live-quest';
// Where the carve puts the worktree, and therefore the cwd every role after riftcarver runs in.
// The fake CLI scopes its response queue by that cwd and Claude CLI encodes its session-JSONL
// directory from it, so this one path is what both halves of this spec turn on.
const WORKTREE_PATH = `${GUILD_PATH}/worktrees/${WORKTREE_NAME}`;

// Slow the fake CLI's lines right down, because a row's transcript is only auto-expanded while that
// row is `in_progress`: the moment an agent exits, its row collapses and its text stops being
// visible. So the window this spec has to land its assertion in is the agent's own lifetime, not
// the test's. At the 10 ms default a whole dispatch — spawn, three lines, signal-back — lands
// inside ~30 ms and the assertion is racing an exit it cannot win.
const AGENT_LINE_DELAY_MS = 1_500;

const RIFTCARVER_OP = '00000000-0000-4000-8000-0000000000d1';
const CODEWEAVER_OP = '00000000-0000-4000-8000-0000000000c1';
const RIFTCARVER_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000059';
const CODEWEAVER_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000060';

const CODEWEAVER_TEXT = 'Codeweaver reporting from inside the carved worktree';

const environment = environmentHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: environment, testObj: test });

// THE BUG THIS EXISTS FOR, AND WHY THE CARVE IS THE BOUNDARY THAT MATTERS.
//
// Codeweaver streamed into its execution row for as long as there was no carve in front of it.
// Riftcarver put one there, and a carve MOVES where every later role runs: its sessions run in the
// WORKTREE, and Claude CLI encodes its session-JSONL directory from the child's own cwd. The live
// execution panel for a dispatched agent is a TAIL of that file, so the server has to resolve the
// tail through the quest's `worktreePath`. Resolved from the guild path instead, the tail watches a
// file that never appears: the row streams nothing, and only a browser reload fills it — because
// subscribe-quest's replay resolves the same session through the quest's OWN recorded cwd and
// therefore finds the real file. Live and replay disagreeing about where a session lives IS the
// defect, and it is invisible to any spec whose quest was never carved.
//
// Nothing in the suite was. Every multi-role spec asserted ledger markers and quest.json only;
// every streaming spec drove a single role on an uncarved quest. So this spec seeds the state a
// GREEN riftcarver leaves behind — a REAL `git worktree add` on the fixture repo, recorded on the
// quest — and then asserts the NEXT role's own words reach the panel with no reload.
//
// The carve is seeded rather than driven because the two are different claims. Whether riftcarver
// can carve is riftcarver's own test to earn; what this one measures is what happens to the role
// AFTER it, and seeding gets there deterministically instead of through minutes of real git.
test.describe('The role after the carve streams into the execution panel with no reload', () => {
  // A deliberately slowed codeweaver dispatch plus two deadline-bounded polls runs past the 10s
  // default per-test budget.
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH, agentCwd: WORKTREE_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH, agentCwd: WORKTREE_PATH }).afterEach();
  });

  test('VALID: {carved quest, riftcarver complete, codeweaver next} => the codeweaver’s own text reaches the execution panel without a reload', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH, agentCwd: WORKTREE_PATH });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Role Transition Streaming Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // A real worktree, on its own branch, in the directory a real carve uses. The codeweaver child
    // is spawned with this as its cwd, so this is the path its session JSONL is encoded from — and
    // it is deliberately NOT the guild path, so resolving the tail from the guild path can no
    // longer accidentally find the right file.
    const worktreePath = environment.carveQuestWorktree({ name: WORKTREE_NAME });

    // The ledger a quest carries the moment its carve goes green: riftcarver complete at the head,
    // the first codeweaver cell next in line. Written directly rather than through
    // dispatchHarness.seedQuest, because that helper links its one work item to operations[0] — it
    // seeds a quest whose FIRST ledger row is the live one, and the whole point here is that the
    // first row is already behind us.
    const created = await quests.createQuest({
      guildId,
      title: 'Role Transition Streaming Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(created.filePath),
      title: 'Role Transition Streaming Quest',
      status: 'in_progress',
      worktreePath: String(worktreePath),
      operations: [
        {
          id: RIFTCARVER_OP,
          role: 'riftcarver',
          text: 'carve the quest branch',
          status: 'complete',
        },
        { id: CODEWEAVER_OP, role: 'codeweaver', text: 'core: first slice', status: 'in_progress' },
      ],
      workItems: [
        {
          id: RIFTCARVER_WORK_ITEM_ID,
          role: 'riftcarver',
          status: 'complete',
          spawnerType: 'command',
          relatedDataItems: [`operations/${RIFTCARVER_OP}`],
        },
        {
          id: CODEWEAVER_WORK_ITEM_ID,
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`operations/${CODEWEAVER_OP}`],
        },
      ],
    });

    // ONE navigation, before anything runs, and never again. Everything asserted below has to
    // arrive over the socket this page load opened.
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    await dispatch.playAndDrive({
      questId: String(questId),
      script: [{ role: 'codeweaver', outcome: 'done', text: CODEWEAVER_TEXT }],
      agentLineDelayMs: AGENT_LINE_DELAY_MS,
    });

    // Precondition, not the claim: the codeweaver was dispatched and is running right now, in the
    // worktree, with a session of its own. waitForQuest names the actual operations and work items
    // it timed out on, where a bare "element not found" cannot say whether the role never ran or
    // ran and never streamed.
    await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: DISPATCH_TIMEOUT,
      predicate: ({ quest }) =>
        quest.workItems.some(
          (workItem) =>
            workItem.role === 'codeweaver' &&
            workItem.status === 'in_progress' &&
            workItem.sessionId !== undefined,
        ),
    });

    // THE REGRESSION GUARD. This text exists only in the session JSONL the codeweaver child wrote
    // under the WORKTREE's path encoding. Seeing it here means the server tailed the file where the
    // carve actually put it, live, on a page that has not reloaded since before the dispatch.
    await expect(executionPanel.getByText(CODEWEAVER_TEXT)).toBeVisible({
      timeout: STREAM_TIMEOUT,
    });

    // Exactly one navigation entry: the text above was delivered by the WS stream, not by a
    // reload's replay — which is the whole distinction the reported symptom turns on, since replay
    // resolves the session correctly and would hide the bug.
    const navigationCount = await page.evaluate(
      () => globalThis.performance.getEntriesByType('navigation').length,
    );

    expect(navigationCount).toBe(1);
  });
});
