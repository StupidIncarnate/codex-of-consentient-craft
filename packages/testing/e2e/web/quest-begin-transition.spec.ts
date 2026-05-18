import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';

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

  test('VALID: clicking Begin Quest sends POST to transition quest status into in_progress', async ({
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

    // start-quest transitions approved → in_progress directly so /dumpster-launch's
    // questGetNextStepBroker picks the quest up on its next pass. The seek_* statuses
    // are dead enum values under the dispatch-loop model; the responder briefly passes
    // through seek_scope internally to satisfy the planningNotes allowlist, but the
    // final persisted status is always in_progress. The UI MUST swap the spec panel
    // for the execution panel live via the quest-modified WS event — no page reload
    // required.
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
      .toBe('in_progress');

    // UI panel swap must happen live (WS-driven) — no reload.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });

  test('VALID: Begin Quest from review_observables transitions quest into in_progress and promotes chaoswhisperer work item', async ({
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

    // start-quest transitions approved → in_progress directly so /dumpster-launch
    // picks the quest up on its next pass. We assert three OrchestrationStartResponder
    // effects on the persisted quest:
    //   1. status is set to in_progress (final persisted state)
    //   2. the pending chaoswhisperer work item is promoted to complete
    //   3. pathseeker work items are added (their runtime status depends on subsequent
    //      pipeline execution, which is deferred to Phase C manual verification)
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
      .toBe('in_progress');

    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();
    const chaoswhispererItem = questData.quest.workItems.find(
      (wi: { role: string }) => wi.role === 'chaoswhisperer',
    );
    const pathseekerCount = questData.quest.workItems.filter((wi: { role: string }) =>
      wi.role.startsWith('pathseeker-'),
    ).length;

    expect(chaoswhispererItem.status).toBe('complete');
    // At least one pathseeker-* work item was created by OrchestrationStartResponder.
    // Under the /dumpster-launch flow OrchestrationStartResponder inserts the four-tier
    // pathseeker graph (surface × N → dedup + assertion-correctness → walk); we only
    // assert that >=1 exists (the responder's primary effect).
    expect(pathseekerCount >= 1).toBe(true);
  });

  test('VALID: Begin Quest inserts the four-tier pathseeker work-item graph into quest.json', async ({
    page,
    request,
  }) => {
    // Under the `/dumpster-launch` model, Begin Quest mutates quest state only —
    // OrchestrationStartResponder calls questBuildPathseekerGraphBroker to insert
    // the surface × N → dedup + assertion-correctness → walk graph (one slice
    // when packagesAffected is empty), promotes the chaoswhisperer chat item to
    // complete, and transitions the quest to in_progress. The orchestrator does
    // NOT spawn anything; `/dumpster-launch` running in the user's Claude session
    // calls get-next-step() to pick the work up on its next pass. This test
    // exercises the post-Begin-Quest persisted graph shape, which is the new
    // observable replacing the old "[PATHSEEKER] row streams via spawn pipeline"
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

    // Wait for in_progress — proves OrchestrationStartResponder finished its
    // three-stage modify pipeline (approved → seek_scope → in_progress).
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
      .toBe('in_progress');

    // Inspect the persisted work-item graph. Empty packagesAffected → one default
    // slice → exactly one pathseeker-surface item plus the dedup +
    // assertion-correctness + walk roles. Dependency edges must mirror the
    // documented surface → corrections → walk fan-in.
    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();
    const surfaceItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'pathseeker-surface',
    );
    const dedupItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'pathseeker-dedup',
    );
    const assertionItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'pathseeker-assertion-correctness',
    );
    const walkItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'pathseeker-walk',
    );

    expect(surfaceItems.length).toBe(1);
    expect(dedupItems.length).toBe(1);
    expect(assertionItems.length).toBe(1);
    expect(walkItems.length).toBe(1);

    const [surfaceItem] = surfaceItems;
    const [dedupItem] = dedupItems;
    const [assertionItem] = assertionItems;
    const [walkItem] = walkItems;

    // surface depends on the prior chat work item ids (chaoswhisperer here).
    expect(surfaceItem.dependsOn).toContain('e2e00000-0000-4000-8000-000000000099');

    // dedup + assertion-correctness fan in on every surface id.
    expect(dedupItem.dependsOn).toContain(surfaceItem.id);
    expect(assertionItem.dependsOn).toContain(surfaceItem.id);

    // walk depends on both corrections. Both ids appear in walkItem.dependsOn —
    // testing the same property twice (not two distinct properties), so this
    // does not trip property-bleedthrough.
    const walkDeps = walkItem.dependsOn as readonly (typeof dedupItem.id)[];

    expect(walkDeps).toContain(dedupItem.id);
    expect(walkDeps).toContain(assertionItem.id);

    // UI panel swap mirrors the other tests in this file.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });
});
