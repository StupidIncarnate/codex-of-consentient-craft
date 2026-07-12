import * as crypto from 'crypto';
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-floor-ordering';
const PANEL_TIMEOUT = 15_000;

wireHarnessLifecycle({ harness: claudeMockHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Floor Ordering', () => {
  const getFloorHeaderTexts = async ({
    page,
  }: {
    page: Parameters<Parameters<typeof test>[2]>[0]['page'];
  }) => {
    const headers = page.getByTestId('floor-header-layer-widget');
    const count = await headers.count();
    const rawTexts = await Promise.all(
      Array.from({ length: count }, async (_, i) => headers.nth(i).textContent()),
    );
    return rawTexts.map((raw) =>
      (raw ?? '')
        .replace(/──+/gu, '')
        .replace(/Concurrent.*$/u, '')
        .trim(),
    );
  };

  const getRoleBadgesUnderFloor = async ({
    page,
    floorIndex,
  }: {
    page: Parameters<Parameters<typeof test>[2]>[0]['page'];
    floorIndex: number;
  }) => {
    const floorContent = page.getByTestId('execution-panel-floor-content');
    const headers = floorContent.getByTestId('floor-header-layer-widget');
    const header = headers.nth(floorIndex);
    const parentBox = header.locator('..');
    const badges = parentBox.getByTestId('execution-row-role-badge');
    const badgeCount = await badges.count();
    const badgeTexts = await Promise.all(
      Array.from({ length: badgeCount }, async (_, i) => badges.nth(i).textContent()),
    );
    return badgeTexts.map((text) => (text ?? '').trim());
  };

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: happy path: floor headers in topological order with roles under correct headers', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Floor Order Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const mainSessionId = `e2e-floor-order-${Date.now()}`;

    sessions.createSessionFileForQuest({ sessionId: mainSessionId });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Floor Ordering Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    const cwId = crypto.randomUUID();
    const wardId = crypto.randomUUID();

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'complete',
      steps: [{ id: 'step-1', name: 'Build module' }],
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
          dependsOn: [],
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: crypto.randomUUID(),
          role: 'pathseeker-surface',
          sessionId: mainSessionId,
          dependsOn: [],
          createdAt: '2024-01-15T10:01:00.000Z',
        },
        {
          id: cwId,
          role: 'codeweaver',
          sessionId: mainSessionId,
          relatedDataItems: ['steps/step-1'],
          dependsOn: [],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: wardId,
          role: 'ward',
          sessionId: mainSessionId,
          dependsOn: [cwId],
          createdAt: '2024-01-15T10:03:00.000Z',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const floorTexts = await getFloorHeaderTexts({ page });

    expect(floorTexts).toStrictEqual([
      'HOMEBASE',
      'ENTRANCE: MAPPING DUMPSTER',
      'FLOOR 1: FORGE',
      'FLOOR 2: MINI BOSS',
    ]);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 0 })).toStrictEqual([
      '[CHAOSWHISPERER]',
    ]);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 1 })).toStrictEqual([
      '[PATHSEEKER-SURFACE]',
    ]);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 2 })).toStrictEqual(['[CODEWEAVER]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 3 })).toStrictEqual(['[WARD]']);
  });

  test('EDGE: codeweaver work items with a dependency cycle => FORGE still renders before the downstream floors (cycle does not invert order)', async ({
    page,
    request,
  }) => {
    // Regression guard for the cycle-inversion bug: when the codeweaver chunks carry a dependency
    // cycle (cwA depends on cwB AND cwB depends on cwA), a naive Kahn topo-sort never resolves them,
    // collapses every downstream role (ward/flowrider/siege/law/blight/full-ward) to depth 0, and
    // floats them ABOVE the codeweavers — so FORGE rendered dead last. The cycle-breaking depth walk
    // keeps FORGE ahead of the downstream floors even with the cycle present.
    const guild = await guildHarness({ request }).createGuild({
      name: 'Codeweaver Cycle Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const mainSessionId = `e2e-cw-cycle-${Date.now()}`;

    sessions.createSessionFileForQuest({ sessionId: mainSessionId });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Codeweaver Cycle Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    const cwAId = crypto.randomUUID();
    const cwBId = crypto.randomUUID();
    const wardChangedId = crypto.randomUUID();
    const flowriderId = crypto.randomUUID();
    const siegeId = crypto.randomUUID();
    const lawbringerId = crypto.randomUUID();
    const blightwardenId = crypto.randomUUID();
    const wardFullId = crypto.randomUUID();

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'in_progress',
      steps: [
        { id: 'step-1', name: 'Build module A' },
        { id: 'step-2', name: 'Build module B' },
      ],
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [],
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: cwAId,
          role: 'codeweaver',
          sessionId: mainSessionId,
          status: 'pending',
          relatedDataItems: ['steps/step-1'],
          dependsOn: [cwBId],
          createdAt: '2024-01-15T10:01:00.000Z',
        },
        {
          id: cwBId,
          role: 'codeweaver',
          sessionId: mainSessionId,
          status: 'pending',
          relatedDataItems: ['steps/step-2'],
          dependsOn: [cwAId],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: wardChangedId,
          role: 'ward',
          sessionId: mainSessionId,
          status: 'pending',
          wardMode: 'changed',
          dependsOn: [cwAId, cwBId],
          createdAt: '2024-01-15T10:03:00.000Z',
        },
        {
          id: flowriderId,
          role: 'flowrider',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [wardChangedId],
          createdAt: '2024-01-15T10:04:00.000Z',
        },
        {
          id: siegeId,
          role: 'siegemaster',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [flowriderId],
          createdAt: '2024-01-15T10:05:00.000Z',
        },
        {
          id: lawbringerId,
          role: 'lawbringer',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [siegeId],
          createdAt: '2024-01-15T10:06:00.000Z',
        },
        {
          id: blightwardenId,
          role: 'blightwarden',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [lawbringerId],
          createdAt: '2024-01-15T10:07:00.000Z',
        },
        {
          id: wardFullId,
          role: 'ward',
          sessionId: mainSessionId,
          status: 'pending',
          wardMode: 'full',
          dependsOn: [blightwardenId],
          createdAt: '2024-01-15T10:08:00.000Z',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const floorTexts = await getFloorHeaderTexts({ page });

    // FORGE (both cyclic codeweavers) renders before MINI BOSS and every downstream floor — the cycle
    // no longer sinks codeweaver below flowrider/siege/lawbringer/blightwarden.
    expect(floorTexts).toStrictEqual([
      'HOMEBASE',
      'FLOOR 1: FORGE',
      'FLOOR 2: FORGE',
      'FLOOR 3: MINI BOSS',
      'FLOOR 4: GLUEWORKS',
      'FLOOR 5: ARENA',
      'FLOOR 6: TRIBUNAL',
      'FLOOR 7: QUARANTINE',
      'FLOOR 8: FLOOR BOSS',
    ]);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 1 })).toStrictEqual(['[CODEWEAVER]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 2 })).toStrictEqual(['[CODEWEAVER]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 3 })).toStrictEqual(['[WARD]']);
  });

  test('VALID: full pipeline with two ward modes => canonical floor order, full ward (FLOOR BOSS) last, flowrider after codeweaver', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Two Ward Modes Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const mainSessionId = `e2e-two-ward-modes-${Date.now()}`;

    sessions.createSessionFileForQuest({ sessionId: mainSessionId });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Two Ward Modes Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    const cwId = crypto.randomUUID();
    const wardChangedId = crypto.randomUUID();
    const flowriderId = crypto.randomUUID();
    const siegeId = crypto.randomUUID();
    const lawbringerId = crypto.randomUUID();
    const blightwardenId = crypto.randomUUID();
    const wardFullId = crypto.randomUUID();

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'in_progress',
      steps: [{ id: 'step-1', name: 'Build module' }],
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [],
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: cwId,
          role: 'codeweaver',
          sessionId: mainSessionId,
          status: 'pending',
          relatedDataItems: ['steps/step-1'],
          dependsOn: [],
          createdAt: '2024-01-15T10:01:00.000Z',
        },
        {
          id: wardChangedId,
          role: 'ward',
          sessionId: mainSessionId,
          status: 'pending',
          wardMode: 'changed',
          dependsOn: [cwId],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: flowriderId,
          role: 'flowrider',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [wardChangedId],
          createdAt: '2024-01-15T10:03:00.000Z',
        },
        {
          id: siegeId,
          role: 'siegemaster',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [flowriderId],
          createdAt: '2024-01-15T10:04:00.000Z',
        },
        {
          id: lawbringerId,
          role: 'lawbringer',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [siegeId],
          createdAt: '2024-01-15T10:05:00.000Z',
        },
        {
          id: blightwardenId,
          role: 'blightwarden',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [lawbringerId],
          createdAt: '2024-01-15T10:06:00.000Z',
        },
        {
          id: wardFullId,
          role: 'ward',
          sessionId: mainSessionId,
          status: 'pending',
          wardMode: 'full',
          dependsOn: [blightwardenId],
          createdAt: '2024-01-15T10:07:00.000Z',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const floorTexts = await getFloorHeaderTexts({ page });

    expect(floorTexts).toStrictEqual([
      'HOMEBASE',
      'FLOOR 1: FORGE',
      'FLOOR 2: MINI BOSS',
      'FLOOR 3: GLUEWORKS',
      'FLOOR 4: ARENA',
      'FLOOR 5: TRIBUNAL',
      'FLOOR 6: QUARANTINE',
      'FLOOR 7: FLOOR BOSS',
    ]);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 1 })).toStrictEqual(['[CODEWEAVER]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 3 })).toStrictEqual(['[FLOWRIDER]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 7 })).toStrictEqual(['[WARD]']);
  });

  test('VALID: two wards with no wardMode => lawbringer-fallback distinguishes floors, ward-with-lawbringer-upstream renders FLOOR BOSS last', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Ward Fallback Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const mainSessionId = `e2e-ward-fallback-${Date.now()}`;

    sessions.createSessionFileForQuest({ sessionId: mainSessionId });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Ward Fallback Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    const cwId = crypto.randomUUID();
    const wardNoLawbringerId = crypto.randomUUID();
    const flowriderId = crypto.randomUUID();
    const lawbringerId = crypto.randomUUID();
    const blightwardenId = crypto.randomUUID();
    const wardLawbringerUpstreamId = crypto.randomUUID();

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'in_progress',
      steps: [{ id: 'step-1', name: 'Build module' }],
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [],
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: cwId,
          role: 'codeweaver',
          sessionId: mainSessionId,
          status: 'pending',
          relatedDataItems: ['steps/step-1'],
          dependsOn: [],
          createdAt: '2024-01-15T10:01:00.000Z',
        },
        {
          id: wardNoLawbringerId,
          role: 'ward',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [cwId],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: flowriderId,
          role: 'flowrider',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [wardNoLawbringerId],
          createdAt: '2024-01-15T10:03:00.000Z',
        },
        {
          id: lawbringerId,
          role: 'lawbringer',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [flowriderId],
          createdAt: '2024-01-15T10:04:00.000Z',
        },
        {
          id: blightwardenId,
          role: 'blightwarden',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [lawbringerId],
          createdAt: '2024-01-15T10:05:00.000Z',
        },
        {
          id: wardLawbringerUpstreamId,
          role: 'ward',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [blightwardenId],
          createdAt: '2024-01-15T10:06:00.000Z',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const floorTexts = await getFloorHeaderTexts({ page });

    expect(floorTexts).toStrictEqual([
      'HOMEBASE',
      'FLOOR 1: FORGE',
      'FLOOR 2: MINI BOSS',
      'FLOOR 3: GLUEWORKS',
      'FLOOR 4: TRIBUNAL',
      'FLOOR 5: QUARANTINE',
      'FLOOR 6: FLOOR BOSS',
    ]);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 2 })).toStrictEqual(['[WARD]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 6 })).toStrictEqual(['[WARD]']);
  });

  test('ERROR: ward fail → spiritmender → ward retry: FORGE before MINI BOSS, INFIRMARY between bosses', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Ward Retry Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const mainSessionId = `e2e-ward-retry-${Date.now()}`;

    sessions.createSessionFileForQuest({ sessionId: mainSessionId });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Floor Ordering Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    const cwId = crypto.randomUUID();
    const wardId = crypto.randomUUID();
    const spiritId = crypto.randomUUID();

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'complete',
      steps: [{ id: 'step-1', name: 'Build module' }],
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
          dependsOn: [],
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: cwId,
          role: 'codeweaver',
          sessionId: mainSessionId,
          relatedDataItems: ['steps/step-1'],
          dependsOn: [],
          createdAt: '2024-01-15T10:01:00.000Z',
        },
        {
          id: wardId,
          role: 'ward',
          sessionId: mainSessionId,
          status: 'failed',
          dependsOn: [cwId],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: spiritId,
          role: 'spiritmender',
          sessionId: mainSessionId,
          dependsOn: [wardId],
          insertedBy: wardId,
          createdAt: '2024-01-15T10:03:00.000Z',
        },
        {
          id: crypto.randomUUID(),
          role: 'ward',
          sessionId: mainSessionId,
          dependsOn: [spiritId],
          insertedBy: wardId,
          createdAt: '2024-01-15T10:04:00.000Z',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const floorTexts = await getFloorHeaderTexts({ page });

    expect(floorTexts).toStrictEqual([
      'HOMEBASE',
      'FLOOR 1: FORGE',
      'FLOOR 2: MINI BOSS',
      'FLOOR 3: INFIRMARY',
      'FLOOR 4: MINI BOSS',
    ]);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 3 })).toStrictEqual([
      '[SPIRITMENDER]',
    ]);
  });

  test('ERROR: siegemaster fail → pathseeker-surface replan: ENTRANCE: MAPPING DUMPSTER after ARENA, skipped items hidden', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Siege Fail Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const mainSessionId = `e2e-siege-fail-${Date.now()}`;

    sessions.createSessionFileForQuest({ sessionId: mainSessionId });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Floor Ordering Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    const cwId = crypto.randomUUID();
    const wardId = crypto.randomUUID();
    const siegeId = crypto.randomUUID();

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'complete',
      steps: [{ id: 'step-1', name: 'Build module' }],
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
          dependsOn: [],
          createdAt: '2024-01-15T09:59:00.000Z',
        },
        {
          id: cwId,
          role: 'codeweaver',
          sessionId: mainSessionId,
          relatedDataItems: ['steps/step-1'],
          dependsOn: [],
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: wardId,
          role: 'ward',
          sessionId: mainSessionId,
          dependsOn: [cwId],
          createdAt: '2024-01-15T10:01:00.000Z',
        },
        {
          id: siegeId,
          role: 'siegemaster',
          sessionId: mainSessionId,
          status: 'failed',
          dependsOn: [wardId],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: crypto.randomUUID(),
          role: 'lawbringer',
          sessionId: mainSessionId,
          status: 'skipped',
          dependsOn: [siegeId],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: crypto.randomUUID(),
          role: 'ward',
          sessionId: mainSessionId,
          status: 'skipped',
          dependsOn: [siegeId],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: crypto.randomUUID(),
          role: 'pathseeker-surface',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [siegeId],
          insertedBy: siegeId,
          createdAt: '2024-01-15T10:03:00.000Z',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const floorTexts = await getFloorHeaderTexts({ page });

    expect(floorTexts).toStrictEqual([
      'HOMEBASE',
      'FLOOR 1: FORGE',
      'FLOOR 2: MINI BOSS',
      'FLOOR 3: ARENA',
      'ENTRANCE: MAPPING DUMPSTER',
    ]);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 3 })).toStrictEqual(['[SIEGEMASTER]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 4 })).toStrictEqual([
      '[PATHSEEKER-SURFACE]',
    ]);
  });

  test('ERROR: blightwarden failed-replan → bare pathseeker re-entry: full-width divider, HOMEBASE re-entry, FLOOR count restarts at 1', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Replan Reentry Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const mainSessionId = `e2e-blight-replan-${Date.now()}`;

    sessions.createSessionFileForQuest({ sessionId: mainSessionId });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Replan Re-entry Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    const ps1Id = crypto.randomUUID();
    const cw1Id = crypto.randomUUID();
    const ward1Id = crypto.randomUUID();
    const blightId = crypto.randomUUID();
    const ps2Id = crypto.randomUUID();
    const cw2Id = crypto.randomUUID();

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'in_progress',
      steps: [{ id: 'step-1', name: 'Build module' }],
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
          dependsOn: [],
          createdAt: '2024-01-15T09:59:00.000Z',
        },
        {
          id: ps1Id,
          role: 'pathseeker',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [],
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: cw1Id,
          role: 'codeweaver',
          sessionId: mainSessionId,
          status: 'complete',
          relatedDataItems: ['steps/step-1'],
          dependsOn: [ps1Id],
          createdAt: '2024-01-15T10:01:00.000Z',
        },
        {
          id: ward1Id,
          role: 'ward',
          sessionId: mainSessionId,
          status: 'complete',
          wardMode: 'changed',
          dependsOn: [cw1Id],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: blightId,
          role: 'blightwarden',
          sessionId: mainSessionId,
          status: 'failed',
          dependsOn: [ward1Id],
          createdAt: '2024-01-15T10:03:00.000Z',
        },
        {
          id: ps2Id,
          role: 'pathseeker',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [],
          insertedBy: blightId,
          createdAt: '2024-01-15T10:04:00.000Z',
        },
        {
          id: cw2Id,
          role: 'codeweaver',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [ps2Id],
          createdAt: '2024-01-15T10:05:00.000Z',
        },
        {
          id: crypto.randomUUID(),
          role: 'ward',
          sessionId: mainSessionId,
          status: 'pending',
          wardMode: 'changed',
          dependsOn: [cw2Id],
          createdAt: '2024-01-15T10:06:00.000Z',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const floorTexts = await getFloorHeaderTexts({ page });

    expect(floorTexts).toStrictEqual([
      'HOMEBASE',
      'FLOOR 1: FORGE',
      'FLOOR 2: MINI BOSS',
      'FLOOR 3: QUARANTINE',
      'HOMEBASE',
      'FLOOR 1: FORGE',
      'FLOOR 2: MINI BOSS',
    ]);

    await expect(page.getByTestId('floor-generation-divider')).toHaveCount(1);
  });
});
