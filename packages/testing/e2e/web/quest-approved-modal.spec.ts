import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { questApprovedModalHarness } from '../../test/harnesses/quest-approved-modal/quest-approved-modal.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-approved-modal';
const MODAL_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 5_000;
const REQUEST_TIMEOUT = 3000;
const HTTP_OK = 200;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

const modalHarness = questApprovedModalHarness({ sessions, guildPath: GUILD_PATH });

test.describe('Quest Approved Modal', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: modal appears when quest transitions to approved status via WS', async ({
    page,
    request,
  }) => {
    const sessionId = `e2e-approved-modal-${Date.now()}`;
    const { questId, urlSlug, quests } = await modalHarness.setupTest({
      request,
      guildName: 'Approved Modal Guild',
      sessionId,
      status: 'review_observables',
    });

    const nav = navigationHarness({ page });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // PATCH quest to approved — triggers quest-modified WS broadcast
    await quests.patchQuestStatus({ questId, status: 'approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
    await expect(page.getByText('Begin Quest')).toBeVisible();
    await expect(page.getByText('Keep Chatting')).toBeVisible();
    // The "Start a new Quest" button was removed by Step 15 of the `/dumpster-create`
    // pivot — new quests are created via the slash command in the user's Claude
    // session, not via a web button. Modal now renders only Begin/Keep buttons.
    await expect(page.getByText('Start a new Quest')).toHaveCount(0);
  });

  test('VALID: modal does not appear when quest transitions to design_approved status via WS', async ({
    page,
    request,
  }) => {
    const sessionId = `e2e-design-approved-${Date.now()}`;
    const { questId, urlSlug, quests } = await modalHarness.setupTest({
      request,
      guildName: 'Design Approved Guild',
      sessionId,
      status: 'review_design',
    });

    const nav = navigationHarness({ page });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await quests.patchQuestStatus({ questId, status: 'design_approved' });

    // Begin Quest modal is gated by shouldShowBeginQuestModalQuestStatusGuard which
    // only returns true for 'approved' (spec/observables gate), not 'design_approved'.
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
  });

  test('VALID: clicking Begin Quest sends POST to quest start endpoint', async ({
    page,
    request,
  }) => {
    const sessionId = `e2e-begin-quest-${Date.now()}`;
    const { questId, urlSlug, quests } = await modalHarness.setupTest({
      request,
      guildName: 'Begin Quest Guild',
      sessionId,
      status: 'review_observables',
    });

    const nav = navigationHarness({ page });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await quests.patchQuestStatus({ questId, status: 'approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Intercept the POST request to verify it was made
    const startRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByText('Begin Quest').click();

    const startRequest = await startRequestPromise;

    expect(startRequest.method()).toBe('POST');

    // Modal should close after clicking
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
  });

  test('EDGE: clicking Keep Chatting sends PATCH to revert quest to review status', async ({
    page,
    request,
  }) => {
    const sessionId = `e2e-keep-chatting-${Date.now()}`;
    const { questId, urlSlug, quests } = await modalHarness.setupTest({
      request,
      guildName: 'Keep Chatting Guild',
      sessionId,
      status: 'review_observables',
    });

    const nav = navigationHarness({ page });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await quests.patchQuestStatus({ questId, status: 'approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Intercept the PATCH to verify it reverts to review_observables
    const patchPromise = page.waitForRequest(
      (req) => req.method() === 'PATCH' && req.url().includes(`/api/quests/${questId}`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByText('Keep Chatting').click();

    const patchRequest = await patchPromise;
    const body = patchRequest.postDataJSON();

    expect(body).toHaveProperty('status', 'review_observables');

    // Modal should close
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Spec panel should remain visible (still in review)
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible();
  });

  test('VALID: modal does not appear for non-approved status transitions', async ({
    page,
    request,
  }) => {
    const sessionId = `e2e-no-modal-${Date.now()}`;
    const { questId, urlSlug, quests } = await modalHarness.setupTest({
      request,
      guildName: 'No Modal Guild',
      sessionId,
      status: 'review_flows',
    });

    const nav = navigationHarness({ page });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Transition to flows_approved (not approved or design_approved)
    await quests.patchQuestStatus({ questId, status: 'flows_approved' });

    // Modal should NOT appear — verify by asserting the modal text is not visible after events propagate
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
  });

  test('VALID: Begin Quest transitions quest into in_progress', async ({ page, request }) => {
    const sessionId = `e2e-execution-${Date.now()}`;
    const { questId, urlSlug, quests } = await modalHarness.setupTest({
      request,
      guildName: 'Execution View Guild',
      sessionId,
      status: 'review_observables',
    });

    const nav = navigationHarness({ page });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await quests.patchQuestStatus({ questId, status: 'approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    await page.getByText('Begin Quest').click();

    // Modal should close
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // start-quest transitions approved → in_progress directly so /dumpster-launch
    // picks the quest up on its next pass. The seek_* statuses are dead enum values
    // under the dispatch-loop model; the responder briefly passes through seek_scope
    // internally to satisfy the planningNotes allowlist, but the final persisted
    // status is always in_progress.
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
        { timeout: PANEL_TIMEOUT },
      )
      .toBe('in_progress');
  });
});
