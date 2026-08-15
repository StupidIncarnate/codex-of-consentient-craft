import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-dispatch-resumes-retained-session';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 20_000;

const OP_ID = '00000000-0000-4000-8000-0000000000a1';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000020';
// The session a dead agent left behind. A fresh spawn would start a NEW session and orphan this
// one — invisible after the fact, because the fresh child stamps its own id over this field.
const RETAINED_SESSION_ID = 'a219be5c-ef0f-4987-abea-ed45fb509bbc';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Dispatch resumes a retained session instead of clobbering it', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {pending siegemaster carrying a sessionId and NO resume marker} => real child is spawned with --resume <sessionId> and the verbatim cut-off prompt', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Retained Session Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Seed the post-crash shape: the work item is dispatchable (`pending`) and carries the dead
    // agent's sessionId, but has NO `resume` marker — the state a quest is left in when it halted
    // before orphan recovery could reclaim the item. This is exactly what used to fresh-spawn.
    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Retained Session Quest',
      userRequest: 'Build the feature',
      operations: [
        {
          id: OP_ID,
          role: 'siegemaster',
          text: 'flow: view-persisted-comments',
          status: 'in_progress',
        },
      ],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
      firstWorkItemSessionId: RETAINED_SESSION_ID,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Two scripted outcomes, because siegemaster is a COMMITTING role: signal-back appends a
    // blightscout review of the commit it just landed, and the dispatcher spawns that too. Driving
    // the relay all the way to that scout's completion is what makes the invocation list below a
    // settled fact rather than a snapshot taken mid-relay — read after only the first work item
    // completes, the scout's spawn races the assertion and the list is 1 or 2 entries by timing.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'siegemaster', outcome: 'done' },
        { role: 'blightscout', outcome: 'done' },
      ],
    });

    const settled = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.workItems.some(
          (wi) => String(wi.id) === FIRST_WORK_ITEM_ID && wi.status === 'complete',
        ) && quest.workItems.some((wi) => wi.role === 'blightscout' && wi.status === 'complete'),
    });
    const scoutWorkItemId = String(settled.workItems.find((wi) => wi.role === 'blightscout')?.id);

    // THE PROOF, read off the real children's argv: the FIRST spawn carried
    // `--resume <the retained sessionId>` plus the RESUME-variant prompt (not the fresh
    // get-agent-prompt one). The scout that follows it is a fresh spawn — `resumeSessionId: null`,
    // which is also what a clobbering fresh spawn of the siegemaster would have recorded, so
    // asserting both entries keeps the contrast visible in one list.
    expect(dispatch.readClaudeInvocations()).toStrictEqual([
      {
        resumeSessionId: RETAINED_SESSION_ID,
        prompt: `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${FIRST_WORK_ITEM_ID}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "siegemaster",\n  workItemId: "${FIRST_WORK_ITEM_ID}",\n  questId: "${String(questId)}"\n}) and follow its instructions from the top.`,
      },
      {
        resumeSessionId: null,
        prompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "blightscout",\n  workItemId: "${scoutWorkItemId}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${scoutWorkItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
      },
    ]);
  });

  test('VALID: {pending codeweaver with NO sessionId} => child is fresh-spawned with the get-agent-prompt task prompt and no --resume', async ({
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });

    const guild = await guilds.createGuild({
      name: 'Fresh Spawn Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Fresh Spawn Quest',
      userRequest: 'Build the feature',
      operations: [
        { id: OP_ID, role: 'codeweaver', text: 'core: config adapter', status: 'in_progress' },
      ],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
    });

    // Codeweaver is a COMMITTING role too, so its signal-back appends a blightscout review and the
    // dispatcher spawns that second child. Both are scripted and both are waited for, so the
    // invocation list is settled rather than a mid-relay snapshot.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'codeweaver', outcome: 'done' },
        { role: 'blightscout', outcome: 'done' },
      ],
    });

    const settled = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.workItems.some(
          (wi) => String(wi.id) === FIRST_WORK_ITEM_ID && wi.status === 'complete',
        ) && quest.workItems.some((wi) => wi.role === 'blightscout' && wi.status === 'complete'),
    });
    const scoutWorkItemId = String(settled.workItems.find((wi) => wi.role === 'blightscout')?.id);

    expect(dispatch.readClaudeInvocations()).toStrictEqual([
      {
        resumeSessionId: null,
        prompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${FIRST_WORK_ITEM_ID}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${FIRST_WORK_ITEM_ID}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
      },
      {
        resumeSessionId: null,
        prompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "blightscout",\n  workItemId: "${scoutWorkItemId}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${scoutWorkItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
      },
    ]);
  });
});
