import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-begin-transition';
const MODAL_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 5_000;
const REQUEST_TIMEOUT = 3000;
const PATHSEEKER_TIMEOUT = 10_000;
const HTTP_OK = 200;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Quest Begin Transition', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: clicking Begin Quest sends POST to /start and rests the quest at seek_scope', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Begin Transition Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-begin-transition-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Begin Transition Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    // Overwrite quest.json with desired status
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'review_observables',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Click APPROVE — drives review_observables → approved through the real UI flow.
    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click();

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Begin Quest must POST to the quest start endpoint (which creates the pathseeker
    // work item via OrchestrationStartResponder). A PATCH to the modify endpoint would
    // skip pathseeker creation — the H-1 root cause bug.
    const startPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    const startRequest = await startPromise;

    expect(startRequest.method()).toBe('POST');
    expect(startRequest.url()).toContain(`/api/quests/${questId}/start`);

    // Modal should close
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // start-quest leaves a PathSeeker-planned feature quest RESTING at seek_scope: the pathseeker
    // work item dispatches there and PathSeeker drives the seek_scope → in_progress completeness
    // gate itself. No dispatcher runs in e2e, so the quest stays at seek_scope. The UI MUST still
    // swap the spec panel for the execution panel live via the quest-modified WS event (seek_scope
    // renders the execution panel) — no page reload required.
    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return null;
          }
          const data = await response.json();
          return data.quest.status;
        },
        { timeout: PATHSEEKER_TIMEOUT },
      )
      .toBe('seek_scope');

    // UI panel swap must happen live (WS-driven) — no reload.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });

  test('VALID: Begin Quest from review_observables rests the quest at seek_scope and promotes chaoswhisperer work item', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Execution Roles Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-exec-roles-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Execution Roles Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    // Chaoswhisperer starts as 'pending' — matches real quest data where
    // the spec phase never explicitly marks the work item complete.
    // The OrchestrationStartResponder must promote it to 'complete' on quest start.
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'review_observables',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'pending',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Click APPROVE — drives review_observables → approved through the real UI flow,
    // which triggers the quest-modified WS broadcast that surfaces the Begin Quest modal.
    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click();

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Click Begin Quest — POST to quest start endpoint
    const startPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    await startPromise;

    // Modal should close
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // start-quest leaves a PathSeeker-planned feature quest RESTING at seek_scope (PathSeeker
    // drives seek_scope → in_progress itself; no dispatcher runs in e2e). We assert three
    // OrchestrationStartResponder effects on the persisted quest:
    //   1. status is set to seek_scope (the planning workspace the quest rests in)
    //   2. the pending chaoswhisperer work item is promoted to complete
    //   3. a single pathseeker work item is added
    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return null;
          }
          const data = await response.json();
          return data.quest.status;
        },
        { timeout: PATHSEEKER_TIMEOUT },
      )
      .toBe('seek_scope');

    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();
    const chaoswhispererItem = questData.quest.workItems.find(
      (wi: { role: string }) => wi.role === 'chaoswhisperer',
    );
    const pathseekerItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'pathseeker',
    );

    expect(chaoswhispererItem.status).toBe('complete');
    // OrchestrationStartResponder seeds a single `pathseeker` planning work item (it summons its
    // surface/dedup/assertion minions as sub-agents at run time, not as separate work items).
    expect(pathseekerItems.length).toBe(1);
  });

  test('VALID: Begin Quest inserts the single pathseeker planning work item into quest.json', async ({
    page,
    request,
  }) => {
    // Under the `/dumpster-launch` model, Begin Quest mutates quest state only —
    // OrchestrationStartResponder calls questBuildPathseekerGraphBroker to insert the single
    // `pathseeker` planning work item, promotes the chaoswhisperer chat item to
    // complete, and leaves the quest RESTING at seek_scope (PathSeeker drives the
    // seek_scope → in_progress gate itself). The orchestrator does NOT spawn anything;
    // `/dumpster-launch` running in the user's Claude session calls get-next-step() to pick the
    // work up on its next pass. This test exercises the post-Begin-Quest persisted graph shape,
    // which is the new observable replacing the old "[PATHSEEKER] row streams via spawn pipeline"
    // surface that the chat-start spawn pipeline used to drive.
    const guild = await guildHarness({ request }).createGuild({
      name: 'Pathseeker Graph Begin Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-pathseeker-graph-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Pathseeker Graph Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'review_observables',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000099',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // APPROVE → modal appears.
    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click();

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    const startPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    await startPromise;

    // Wait for seek_scope — proves OrchestrationStartResponder finished its modify pipeline
    // (approved → seek_scope + scopeClassification seed) and left the feature quest resting there
    // for PathSeeker (no Start promote to in_progress).
    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return null;
          }
          const data = await response.json();
          return data.quest.status;
        },
        { timeout: PATHSEEKER_TIMEOUT },
      )
      .toBe('seek_scope');

    // Inspect the persisted work-item graph. PathSeeker is a single `pathseeker` planning work
    // item that depends on the prior chat work item (chaoswhisperer here); it summons its
    // surface/dedup/assertion minions as sub-agents within its own turn, not as work items.
    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();
    const pathseekerItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'pathseeker',
    );

    expect(pathseekerItems.length).toBe(1);

    const [pathseekerItem] = pathseekerItems;

    // The pathseeker planner depends on the prior chat work item ids (chaoswhisperer here).
    expect(pathseekerItem.dependsOn).toContain('e2e00000-0000-4000-8000-000000000099');

    // UI panel swap mirrors the other tests in this file.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });
});
