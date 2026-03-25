import { test, expect } from '@dungeonmaster/testing/e2e';
import { wireHarnessLifecycle } from './fixtures/harness-wire';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { cleanGuilds, createGuild, createQuest } from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-begin-transition';
const MODAL_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 5_000;
const REQUEST_TIMEOUT = 3000;
const PATHSEEKER_TIMEOUT = 10_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Quest Begin Transition', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds({ request });
    sessions.cleanSessionDirectory();
  });

  test('clicking Begin Quest sends PATCH to transition quest status to in_progress', async ({
    page,
    request,
  }) => {
    const guild = await createGuild({ request, name: 'Begin Transition Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-begin-transition-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    // Create quest via API to get the server-resolved file path
    const created = await createQuest({
      request,
      guildId,
      title: 'E2E Begin Transition Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

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
    await nav.navigateToSession({ urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await quests.patchQuestStatus({ questId, status: 'approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Begin Quest must POST to the quest start endpoint (which creates the pathseeker
    // work item via OrchestrationStartResponder). A PATCH to the modify endpoint would
    // set status=in_progress but skip pathseeker creation — the H-1 root cause bug.
    const startPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByRole('button', { name: 'Begin Quest' }).click();

    const startRequest = await startPromise;

    expect(startRequest.method()).toBe('POST');
    expect(startRequest.url()).toContain(`/api/quests/${questId}/start`);

    // Modal should close and execution view should appear
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('dumpster-raccoon-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Pathseeker work item must appear in the execution panel.
    // Without this check, the test passes even if the quest goes straight
    // to complete with no pathseeker (the H-1 bug).
    await expect(page.getByText('[PATHSEEKER]')).toBeVisible({
      timeout: PATHSEEKER_TIMEOUT,
    });
  });

  test('clicking Begin Quest on design_approved sends POST to quest start endpoint', async ({
    page,
    request,
  }) => {
    const guild = await createGuild({ request, name: 'Design Begin Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-design-begin-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    // Create quest via API to get the server-resolved file path
    const created = await createQuest({
      request,
      guildId,
      title: 'E2E Design Begin Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

    // Overwrite quest.json with desired status
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'review_design',
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
    await nav.navigateToSession({ urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await quests.patchQuestStatus({ questId, status: 'design_approved' });

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    const startPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByRole('button', { name: 'Begin Quest' }).click();

    const startRequest = await startPromise;

    expect(startRequest.method()).toBe('POST');
    expect(startRequest.url()).toContain(`/api/quests/${questId}/start`);

    // Modal should close and execution view should appear
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('dumpster-raccoon-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Pathseeker work item must appear in the execution panel
    await expect(page.getByText('[PATHSEEKER]')).toBeVisible({
      timeout: PATHSEEKER_TIMEOUT,
    });
  });
});
