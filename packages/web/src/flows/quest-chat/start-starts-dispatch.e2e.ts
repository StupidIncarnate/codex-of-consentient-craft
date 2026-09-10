import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-start-starts-dispatch';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 25_000;
const HTTP_OK = 200;

const CODEWEAVER_OP = '00000000-0000-4000-8000-0000000000c1';
const CHAOS_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000040';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

// The twin of resume-starts-dispatch.e2e.ts, for the OTHER door into the queue. Starting a quest
// and starting the Node dispatcher are two separate switches: the dispatcher normalizes to `paused`
// on every server boot, so Begin Quest seeded the ledger, flipped the quest to `in_progress`,
// enqueued it — and stopped there, because the dispatch loop returns on its own `isPlaying()`
// check. The quest sat at `in_progress` with a ready work item and nothing to pick it up.
//
// Resume grew this coupling first and got resume-starts-dispatch.e2e.ts with it; start did not, and
// nothing in the suite crossed the start button with the dispatcher's state, so the gap was
// invisible. This spec is that crossing.
test.describe('Begin Quest starts the dispatch queue', () => {
  // Drives the real relay (fake-CLI child + signal-back) past the 10s default per-test budget.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {approved quest, dispatcher paused} => clicking Begin Quest starts the queue and the work item runs to completion', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Start Starts Dispatch Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-session-start-dispatch-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'Start Starts Dispatch Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;

    // The state Begin Quest is offered from: the observables gate passed, nothing dispatched yet.
    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath: created.filePath,
      status: 'approved',
      workItems: [{ id: CHAOS_WORK_ITEM_ID, role: 'chaoswhisperer', sessionId }],
      operations: [
        {
          id: CODEWEAVER_OP,
          role: 'codeweaver',
          text: 'core: build the feature',
          status: 'pending',
        },
      ],
    });

    // The agent Begin Quest is about to spawn needs a queued outcome waiting for it — an unqueued
    // spawn exits red-on-empty with no signal-back and churns orphan recovery.
    dispatch.queueScript({ script: [{ role: 'codeweaver', outcome: 'done' }] });

    // Precondition: the dispatcher is explicitly NOT playing (beforeEach paused it).
    expect(await dispatch.isDispatchPlaying()).toBe(false);

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const beginQuestButton = page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' });

    await expect(beginQuestButton).toBeVisible({ timeout: PANEL_TIMEOUT });

    const startResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/start`),
    );

    await beginQuestButton.click();

    const startResponse = await startResponsePromise;

    expect(startResponse.status()).toBe(HTTP_OK);

    const startBody = await startResponse.json();

    expect(startBody.dispatch).toStrictEqual({ started: true });

    // The queue is genuinely on — not just reported on.
    expect(await dispatch.isDispatchPlaying()).toBe(true);

    // And it actually dispatched: the seeded codeweaver operation ran and the ledger drained, which
    // is the whole point of coupling the two switches. Asserting the ledger rather than the status
    // alone — `in_progress` is reached by the start itself and says nothing about the dispatcher.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.operations.some((op) => op.role === 'codeweaver' && op.status === 'complete'),
    });

    expect(
      finalQuest.workItems
        .filter((workItem) => workItem.role === 'codeweaver')
        .map((workItem) => workItem.status),
    ).toStrictEqual(['complete']);
  });
});
