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
const IN_PROGRESS_TIMEOUT = 10_000;
const HTTP_OK = 200;

// A feature quest needs a Chaos-authored codeweaver operation item on its ledger before it can be
// approved (the observables gate enables the APPROVE button) and before Start can seed the relay
// from it. Start marks this item the first actionable operation and links the first work item to it.
const CODEWEAVER_OP_ID = '00000000-0000-4000-8000-0000000000b1';

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Quest Begin Transition', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: clicking Begin Quest sends POST to /start and transitions the quest to in_progress', async ({
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

    // Overwrite quest.json with desired status + the codeweaver operation the observables gate needs
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
      operations: [
        {
          id: CODEWEAVER_OP_ID,
          role: 'codeweaver',
          text: 'core: build the feature',
          status: 'pending',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Click APPROVE — drives review_observables → approved through the real UI flow. The button is
    // enabled because the ledger carries a codeweaver operation item (the observables gate).
    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click();

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Begin Quest must POST to the quest start endpoint (which seeds the operations relay
    // via OrchestrationStartResponder). A PATCH to the modify endpoint would skip the relay
    // seed — the H-1 root cause bug.
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

    // start-quest transitions the approved feature quest straight to in_progress and seeds the
    // operations relay; OrchestrationStartResponder spawns nothing (the active dispatcher picks it
    // up). The UI MUST still swap the spec panel for the execution panel live via the quest-modified
    // WS event (in_progress renders the execution panel) — no page reload required.
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
        { timeout: IN_PROGRESS_TIMEOUT },
      )
      .toBe('in_progress');

    // UI panel swap must happen live (WS-driven) — no reload.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    // The seeded operations relay renders as the ledger inside the execution panel.
    await expect(page.getByTestId('OPERATIONS_LEDGER')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });

  test('VALID: Begin Quest from review_observables transitions to in_progress, promotes chaoswhisperer, and seeds the operations relay', async ({
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
      operations: [
        {
          id: CODEWEAVER_OP_ID,
          role: 'codeweaver',
          text: 'core: build the feature',
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

    // start-quest transitions the approved feature quest to in_progress and seeds the relay
    // (no dispatcher runs in e2e). We assert three OrchestrationStartResponder effects on the
    // persisted quest:
    //   1. status is set to in_progress
    //   2. the pending chaoswhisperer work item is promoted to complete
    //   3. the operations relay is seeded (a codeweaver operation item) with its first work item
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
        { timeout: IN_PROGRESS_TIMEOUT },
      )
      .toBe('in_progress');

    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();
    const chaoswhispererItem = questData.quest.workItems.find(
      (wi: { role: string }) => wi.role === 'chaoswhisperer',
    );
    const codeweaverItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'codeweaver',
    );

    expect(chaoswhispererItem.status).toBe('complete');
    // The relay seed marks the codeweaver operation item the first actionable item and creates
    // exactly ONE work item for it (strict 1:1 operation↔work-item).
    expect(
      questData.quest.operations.some((op: { role: string }) => op.role === 'codeweaver'),
    ).toBe(true);
    expect(codeweaverItems.length).toBe(1);
  });

  test('VALID: Begin Quest seeds the operations relay and its first work item into quest.json', async ({
    page,
    request,
  }) => {
    // Under the `/dumpster-launch` model, Begin Quest mutates quest state only —
    // OrchestrationStartResponder calls questBuildRelayGraphBroker to seed the operations relay
    // (the Chaos-authored codeweaver plan item + the fixed verify tail), promotes the
    // chaoswhisperer chat item to complete, creates the FIRST work item for the first actionable
    // operation, and transitions the quest approved → in_progress. The orchestrator does NOT spawn
    // anything; `/dumpster-launch` running in the user's Claude session calls get-next-step() to
    // pick the work up on its next pass. This test exercises the post-Begin-Quest persisted graph
    // shape (the seeded ledger + its first work item).
    const guild = await guildHarness({ request }).createGuild({
      name: 'Relay Graph Begin Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-relay-graph-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Relay Graph Quest',
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
      operations: [
        {
          id: CODEWEAVER_OP_ID,
          role: 'codeweaver',
          text: 'core: build the feature',
          status: 'pending',
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

    // Wait for in_progress — proves OrchestrationStartResponder finished its relay seed + status
    // transition (approved → in_progress). Start spawns nothing; the active dispatcher picks it up.
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
        { timeout: IN_PROGRESS_TIMEOUT },
      )
      .toBe('in_progress');

    // Inspect the persisted work-item graph. The relay seed creates a single first work item for
    // the codeweaver operation item; it depends on the prior chat work item (chaoswhisperer here)
    // and links 1:1 to its operation item via relatedDataItems: ['operations/<id>'].
    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();
    const codeweaverItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'codeweaver',
    );

    expect(codeweaverItems.length).toBe(1);

    const [codeweaverItem] = codeweaverItems;

    // The first relay work item depends on the prior chat work item ids (chaoswhisperer here).
    expect(codeweaverItem.dependsOn).toContain('e2e00000-0000-4000-8000-000000000099');

    // UI panel swap mirrors the other tests in this file.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });
});
