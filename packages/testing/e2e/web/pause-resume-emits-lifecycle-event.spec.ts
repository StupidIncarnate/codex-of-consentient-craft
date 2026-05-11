import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';

import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { wsQuestLifecycleHarness } from '../../test/harnesses/ws-quest-lifecycle/ws-quest-lifecycle.harness';

const GUILD_PATH = '/tmp/dm-e2e-pause-resume-lifecycle';
const PANEL_TIMEOUT = 10_000;
const WIRE_TIMEOUT = 10_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Pause/Resume emits lifecycle events', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {click PAUSE on seek_walk quest} => server broadcasts a quest-paused WS frame for that questId', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Pause-Emit Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-pause-emit-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Pause-Emit',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'seek_walk',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000a1',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const expectedQuestId = String(questId);
    const wsCapture = wsQuestLifecycleHarness({ page, questId: expectedQuestId });
    wsCapture.beforeEach();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: expectedQuestId });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const pauseButton = page.getByTestId('EXECUTION_PAUSE_BUTTON');

    await expect(pauseButton).toBeVisible({ timeout: PANEL_TIMEOUT });

    const pausePromise = page.waitForRequest(
      (req) =>
        req.method() === 'POST' && req.url().includes(`/api/quests/${expectedQuestId}/pause`),
    );

    await pauseButton.click();
    await pausePromise;

    await expect
      .poll(() => wsCapture.matchedQuestIdsFor({ eventType: 'quest-paused' }).length, {
        timeout: WIRE_TIMEOUT,
      })
      .toBe(1);

    expect(wsCapture.matchedQuestIdsFor({ eventType: 'quest-paused' })).toStrictEqual([
      expectedQuestId,
    ]);
  });

  test('VALID: {click RESUME on paused quest} => server broadcasts a quest-resumed WS frame for that questId', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Resume-Emit Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-resume-emit-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Resume-Emit',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'paused',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000a2',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await request.patch(`/api/quests/${questId}`, {
      data: { pausedAtStatus: 'in_progress' },
    });

    const expectedQuestId = String(questId);
    const wsCapture = wsQuestLifecycleHarness({ page, questId: expectedQuestId });
    wsCapture.beforeEach();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: expectedQuestId });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const resumeButton = page.getByTestId('EXECUTION_RESUME_BUTTON');

    await expect(resumeButton).toBeVisible({ timeout: PANEL_TIMEOUT });

    const resumeResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes(`/api/quests/${expectedQuestId}/resume`),
    );

    await resumeButton.click();
    await resumeResponsePromise;

    await expect
      .poll(() => wsCapture.matchedQuestIdsFor({ eventType: 'quest-resumed' }).length, {
        timeout: WIRE_TIMEOUT,
      })
      .toBe(1);

    expect(wsCapture.matchedQuestIdsFor({ eventType: 'quest-resumed' })).toStrictEqual([
      expectedQuestId,
    ]);
  });
});
