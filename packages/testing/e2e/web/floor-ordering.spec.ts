import * as crypto from 'crypto';
import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';

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
      Array.from({ length: count }, (_, i) => headers.nth(i).textContent()),
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
      Array.from({ length: badgeCount }, (_, i) => badges.nth(i).textContent()),
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
          role: 'pathseeker',
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
      'ENTRANCE: CARTOGRAPHY',
      'FLOOR 1: FORGE',
      'FLOOR 2: MINI BOSS',
    ]);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 0 })).toStrictEqual([
      '[CHAOSWHISPERER]',
    ]);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 1 })).toStrictEqual(['[PATHSEEKER]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 2 })).toStrictEqual(['[CODEWEAVER]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 3 })).toStrictEqual(['[WARD]']);
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

  test('ERROR: siegemaster fail → pathseeker replan: CARTOGRAPHY after ARENA, skipped items hidden', async ({
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
          role: 'pathseeker',
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
      'ENTRANCE: CARTOGRAPHY',
    ]);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 3 })).toStrictEqual(['[SIEGEMASTER]']);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 4 })).toStrictEqual(['[PATHSEEKER]']);
  });
});
