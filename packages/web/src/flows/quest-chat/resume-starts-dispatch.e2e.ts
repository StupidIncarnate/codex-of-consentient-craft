import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-resume-starts-dispatch';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 25_000;
const HTTP_OK = 200;

const CODEWEAVER_OP = '00000000-0000-4000-8000-0000000000c1';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000030';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// Resuming a quest and starting the Node dispatcher used to be two separate switches: the
// dispatcher normalizes to `paused` on every server boot, so hitting RESUME left the quest at
// `in_progress` with a ready work item and nothing to pick it up. Resume now plays dispatch —
// but only for a quest the dispatcher would actually act on.
test.describe('Resume starts the dispatch queue', () => {
  // Drives the real relay (fake-CLI child + signal-back) past the 10s default per-test budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {paused quest with a ready work item, dispatcher paused} => clicking RESUME starts the queue and the work item runs to completion', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Resume Starts Dispatch Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Resume Starts Dispatch Quest',
      userRequest: 'Build the feature',
      operations: [
        {
          id: CODEWEAVER_OP,
          role: 'codeweaver',
          text: 'build core',
          status: 'in_progress',
          locked: false,
        },
      ],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
    });

    // The agent RESUME is about to spawn needs a queued outcome waiting for it — an unqueued
    // spawn exits red-on-empty with no signal-back and churns orphan recovery. Codeweaver is a
    // committing role, so its `done` auto-appends a blightscout review right after it — queue that
    // outcome too, or the second dispatch exits red-on-empty the same way.
    dispatch.queueScript({
      script: [
        { role: 'codeweaver', outcome: 'done' },
        { role: 'blightscout', outcome: 'done' },
      ],
    });

    // Precondition: quest paused, and the dispatcher explicitly NOT playing (beforeEach paused it).
    await request.post(`/api/quests/${questId}/pause`);

    expect(await dispatch.isDispatchPlaying()).toBe(false);

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const resumeButton = page.getByTestId('EXECUTION_RESUME_BUTTON');

    await expect(resumeButton).toBeVisible({ timeout: PANEL_TIMEOUT });

    const resumeResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/resume`),
    );

    await resumeButton.click();

    const resumeResponse = await resumeResponsePromise;

    expect(resumeResponse.status()).toBe(HTTP_OK);
    expect(await resumeResponse.json()).toStrictEqual({
      resumed: true,
      restoredStatus: 'in_progress',
      dispatch: { started: true },
    });

    // The queue is genuinely on — not just reported on.
    expect(await dispatch.isDispatchPlaying()).toBe(true);

    // And it actually dispatched: the seeded work item ran, its auto-appended blightscout review
    // ran after it (codeweaver is a committing role), and the ledger drained — which is the whole
    // point of coupling the two switches.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.operations.length === 2 && quest.operations.every((op) => op.status === 'complete'),
    });

    expect(finalQuest.workItems.map((workItem) => workItem.status)).toStrictEqual([
      'complete',
      'complete',
    ]);
  });

  test('VALID: {paused quest whose ledger is already drained} => RESUME leaves the global dispatcher alone', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Resume No Work Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const created = await quests.createQuest({
      guildId,
      title: 'Resume No Work Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath: created.filePath,
      status: 'paused',
      workItems: [
        {
          id: FIRST_WORK_ITEM_ID,
          role: 'codeweaver',
          status: 'complete',
        },
      ],
    });

    await request.patch(`/api/quests/${questId}`, { data: { pausedAtStatus: 'in_progress' } });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const resumeButton = page.getByTestId('EXECUTION_RESUME_BUTTON');

    await expect(resumeButton).toBeVisible({ timeout: PANEL_TIMEOUT });

    const resumeResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/resume`),
    );

    await resumeButton.click();

    const resumeResponse = await resumeResponsePromise;

    expect(await resumeResponse.json()).toStrictEqual({
      resumed: true,
      restoredStatus: 'in_progress',
      dispatch: { started: false, reason: 'quest has no dispatchable work' },
    });

    // The dispatcher is global — a quest with nothing to run must not switch it on for everyone.
    expect(await dispatch.isDispatchPlaying()).toBe(false);
  });
});
