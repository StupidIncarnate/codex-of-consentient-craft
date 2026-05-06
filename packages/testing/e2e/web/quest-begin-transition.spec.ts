import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
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
// Tighter timeouts for the chat-tail-leak test, which has more pre-poll wallclock
// (chat round-trip + APPROVE + Begin Quest) and must fit inside the global 10s
// per-test timeout. The orchestration loop marks pathseeker `in_progress` within
// ~100ms of the dispatch decision, well under 5s.
const CHAT_TAIL_RESPONSE_TIMEOUT = 4_000;
const CHAT_TAIL_PATHSEEKER_TIMEOUT = 5_000;
const HTTP_OK = 200;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });

test.describe('Quest Begin Transition', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: clicking Begin Quest sends POST to transition quest status into PathSeeker pipeline (seek_scope)', async ({
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

    // start-quest transitions approved → seek_scope (entry into PathSeeker pipeline).
    // seek_* is now classified as an execution phase (isExecutionPhaseGuard), so the
    // UI MUST swap the spec panel for the execution panel live via the quest-modified
    // WS event — no page reload required.
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

  test('VALID: Begin Quest from review_observables transitions quest into PathSeeker pipeline (seek_scope) and promotes chaoswhisperer work item', async ({
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

    // start-quest transitions approved → seek_scope (entry into PathSeeker pipeline).
    // The full pipeline (seek_scope → seek_synth → seek_walk → seek_plan → in_progress)
    // requires a real Claude subprocess; in the e2e environment the fake CLI doesn't
    // drive these transitions, so the execution panel (gated by isExecutionPhaseGuard)
    // only activates at in_progress and beyond.
    // We still assert two OrchestrationStartResponder effects on the persisted quest:
    //   1. status is set to seek_scope
    //   2. the pending chaoswhisperer work item is promoted to complete
    //   3. a pathseeker work item is added (its runtime status depends on subsequent
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
      .toBe('seek_scope');

    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();
    const chaoswhispererItem = questData.quest.workItems.find(
      (wi: { role: string }) => wi.role === 'chaoswhisperer',
    );
    const pathseekerCount = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'pathseeker',
    ).length;

    expect(chaoswhispererItem.status).toBe('complete');
    // At least one pathseeker item was created by OrchestrationStartResponder.
    // In the e2e environment the fake CLI may cause retries that create additional
    // pathseeker items; we only assert that >=1 exists (the responder's primary effect).
    expect(pathseekerCount >= 1).toBe(true);
  });

  test('VALID: Begin Quest after a real chaoswhisperer chat dispatches the pathseeker work item (status leaves pending) and renders the [PATHSEEKER] row in the execution panel', async ({
    page,
    request,
  }) => {
    // Reproduces the user-reported scenario: a chaoswhisperer chat has actually run
    // (so `chat-start-responder.onComplete` has registered a `chat-${UUID}` post-exit
    // JSONL tail under the quest's real questId via `orchestrationProcessesState`).
    // A subsequent Begin Quest click MUST still cause the orchestration loop to
    // dispatch the inserted pathseeker work item out of `pending` — anything less
    // is the bug where the queue runner sees the lingering chat tail under the
    // quest's questId and silently treats it as "another loop is already running."
    // The earlier tests in this file write the quest file directly without ever
    // running a chat, so they don't register a chat tail and therefore can't catch
    // this regression.
    const guild = await guildHarness({ request }).createGuild({
      name: 'Chat Tail Begin Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-chat-tail-begin-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Chat-Tail Begin Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    // Seed the quest at review_observables with a chaoswhisperer work item bound to
    // the seeded session JSONL — the same shape the real spec phase produces. The
    // sessionId on the work item is what `chat-start-responder` resumes (`--resume`)
    // when the user sends a chat message from the quest workspace, which is what
    // ultimately triggers `chatMainSessionTailBroker` to register the post-exit
    // tail under the quest's questId.
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

    // Drive a real chat round-trip so the post-exit tail registers under questId.
    // The clarification-request flow is irrelevant — any completed chat exits via
    // `chat-start-responder.onComplete`, which is what registers the tail.
    const chatTailMarker = `Chat tail registration marker ${Date.now()}`;
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ text: chatTailMarker }),
    });

    await page.getByTestId('CHAT_INPUT').fill('Tell me about scope');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for the response text — proves the chat fully completed and the
    // post-exit tail registration has fired by the time we move on. The natural
    // delay between this assertion and the Begin Quest click below is more than
    // enough for `chatMainSessionTailBroker(...).then(register)` to have run.
    await expect(page.getByText(chatTailMarker)).toBeVisible({
      timeout: CHAT_TAIL_RESPONSE_TIMEOUT,
    });

    // Approve the spec to unlock the Begin Quest modal.
    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click();

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Queue a pathseeker response so when the orchestration loop dispatches the
    // pathseeker work item, the fake CLI has something to stream — gives the UI
    // a stable "running" surface to assert against. Without this the fake CLI
    // would exit non-zero and the work item could flap pending → in_progress →
    // failed before our assertion observes it.
    const pathseekerMarker = `Pathseeker dispatched marker ${Date.now()}`;
    const pathseekerResponse = SimpleTextResponseStub({ text: pathseekerMarker });
    pathseekerResponse.delayMs = 1500;
    claudeMock.queueResponse({ response: pathseekerResponse });

    const startPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    await startPromise;

    // The bug surface: pathseeker work item stays at 'pending' forever because
    // the queue runner found the lingering chat tail under the questId and
    // skipped the loop start. With the fix the loop dispatches the pathseeker
    // and the work item moves to in_progress (and onward).
    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return null;
          }
          const data = await response.json();
          const pathseekers = data.quest.workItems.filter(
            (wi: { role: string }) => wi.role === 'pathseeker',
          );
          if (pathseekers.length === 0) {
            return null;
          }
          // The orchestration loop has dispatched at least one pathseeker as
          // soon as ANY pathseeker work item leaves the 'pending' state.
          return pathseekers.some((wi: { status: string }) => wi.status !== 'pending');
        },
        { timeout: CHAT_TAIL_PATHSEEKER_TIMEOUT },
      )
      .toBe(true);

    // UI half: the [PATHSEEKER] role badge must render in the execution panel.
    // Without dispatch the row still shows up as a pending entry but it is
    // not the target — the assertion above already covers status; here we
    // confirm the UI surfaced the dispatched row.
    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(
      executionPanel.getByTestId('execution-row-role-badge').filter({ hasText: '[PATHSEEKER]' }),
    ).toBeVisible({ timeout: CHAT_TAIL_PATHSEEKER_TIMEOUT });
  });
});
