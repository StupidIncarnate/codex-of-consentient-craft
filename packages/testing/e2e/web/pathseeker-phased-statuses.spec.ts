import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { PlanningScopeClassificationStub } from '@dungeonmaster/shared/contracts';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-pathseeker-phased';
const PANEL_TIMEOUT = 5_000;
const HTTP_OK = 200;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('PathSeeker Phased Statuses', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {status: seek_scope} => execution panel renders (seek_* is execution phase)', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'PathSeeker Seek Scope Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-seek-scope-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Seek Scope Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'seek_scope',
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

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });

  test('VALID: {status: seek_synth} => execution panel renders (seek_* is execution phase)', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'PathSeeker Seek Synth Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-seek-synth-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Seek Synth Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'seek_synth',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000002',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToSession({ urlSlug, sessionId });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });

  test('VALID: {status: seek_walk} => execution panel renders (seek_* is execution phase)', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'PathSeeker Seek Walk Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-seek-walk-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Seek Walk Quest',
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
          id: 'e2e00000-0000-4000-8000-000000000003',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToSession({ urlSlug, sessionId });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });

  test('VALID: {status: seek_plan} => execution panel renders (seek_* is execution phase)', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'PathSeeker Seek Plan Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-seek-plan-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Seek Plan Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'seek_plan',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000004',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToSession({ urlSlug, sessionId });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });

  test('VALID: {status: seek_scope, PATCH planningNotes.scopeClassification} => PATCH succeeds, GET returns planningNotes, UI stays stable', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'PathSeeker PlanningNotes PATCH Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-planning-patch-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E PlanningNotes PATCH Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'seek_scope',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000005',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToSession({ urlSlug, sessionId });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Build a valid planningNotes.scopeClassification payload from the contract stub.
    // The stub parses through the Zod contract, so the returned object is validated and
    // carries branded types that serialize to plain strings over JSON.
    const scopeClassification = PlanningScopeClassificationStub({
      size: 'small',
      classifiedAt: new Date().toISOString(),
    });

    const patchResponse = await request.patch(`/api/quests/${questId}`, {
      data: {
        planningNotes: {
          scopeClassification,
        },
      },
    });

    expect(patchResponse.status()).toBe(HTTP_OK);

    const patchBody = (await patchResponse.json()) as Record<PropertyKey, unknown>;

    expect(patchBody.success).toBe(true);

    // GET the quest back — server wraps the quest as { success, quest } per getQuestResultContract.
    const getResponse = await request.get(`/api/quests/${questId}`);

    expect(getResponse.status()).toBe(HTTP_OK);

    const getBody = (await getResponse.json()) as Record<PropertyKey, unknown>;
    const questPayload = getBody.quest as Record<PropertyKey, unknown> | undefined;
    const planningNotes = questPayload?.planningNotes as Record<PropertyKey, unknown> | undefined;
    const persistedScope = planningNotes?.scopeClassification as
      | Record<PropertyKey, unknown>
      | undefined;

    expect(persistedScope?.size).toBe(scopeClassification.size);
    expect(persistedScope?.slicing).toBe(String(scopeClassification.slicing));
    expect(persistedScope?.rationale).toBe(String(scopeClassification.rationale));

    // UI must not crash — execution panel stays visible after the WS quest-modified event fires.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
  });
});
