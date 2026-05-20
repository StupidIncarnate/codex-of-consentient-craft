import * as crypto from 'crypto';
import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-pathseeker-entrance-collapse';
const PANEL_TIMEOUT = 15_000;

wireHarnessLifecycle({ harness: claudeMockHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Pathseeker Entrance Collapse', () => {
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

  test('VALID: {single phase: chaos + 4 pathseeker-* split roles wired through real dependency graph} => one ENTRANCE: MAPPING DUMPSTER floor containing all 4 pathseeker-* rows in topological order', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Single Phase Entrance Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const mainSessionId = `e2e-entrance-collapse-${Date.now()}`;

    sessions.createSessionFileForQuest({ sessionId: mainSessionId });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Entrance Collapse Single Phase',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    const chaosId = crypto.randomUUID();
    const psSurfaceId = crypto.randomUUID();
    const psDedupId = crypto.randomUUID();
    const psAcId = crypto.randomUUID();

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'complete',
      steps: [],
      workItems: [
        {
          id: chaosId,
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [],
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: psSurfaceId,
          role: 'pathseeker-surface',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [chaosId],
          createdAt: '2024-01-15T10:01:00.000Z',
        },
        {
          id: psDedupId,
          role: 'pathseeker-dedup',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [psSurfaceId],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: psAcId,
          role: 'pathseeker-assertion-correctness',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [psSurfaceId],
          createdAt: '2024-01-15T10:02:01.000Z',
        },
        {
          id: crypto.randomUUID(),
          role: 'pathseeker-walk',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [psDedupId, psAcId],
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

    expect(floorTexts).toStrictEqual(['HOMEBASE', 'ENTRANCE: MAPPING DUMPSTER']);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 0 })).toStrictEqual([
      '[CHAOSWHISPERER]',
    ]);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 1 })).toStrictEqual([
      '[PATHSEEKER-SURFACE]',
      '[PATHSEEKER-DEDUP]',
      '[PATHSEEKER-ASSERTION-CORRECTNESS]',
      '[PATHSEEKER-WALK]',
    ]);
  });

  test('VALID: {two phases: phase1 ps-* complete → forge → ward fail → phase2 ps-* re-summon} => two distinct ENTRANCE: MAPPING DUMPSTER floors with FORGE and MINI BOSS between them (history preserved)', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Two Phase History Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const mainSessionId = `e2e-entrance-history-${Date.now()}`;

    sessions.createSessionFileForQuest({ sessionId: mainSessionId });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Entrance Collapse Two Phase History',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    const chaosId = crypto.randomUUID();
    const ps1SurfaceId = crypto.randomUUID();
    const ps1DedupId = crypto.randomUUID();
    const ps1AcId = crypto.randomUUID();
    const ps1WalkId = crypto.randomUUID();
    const cwId = crypto.randomUUID();
    const wardFailedId = crypto.randomUUID();
    const ps2SurfaceId = crypto.randomUUID();
    const ps2DedupId = crypto.randomUUID();
    const ps2AcId = crypto.randomUUID();

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'complete',
      steps: [{ id: 'step-1', name: 'Build module' }],
      workItems: [
        {
          id: chaosId,
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [],
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: ps1SurfaceId,
          role: 'pathseeker-surface',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [chaosId],
          createdAt: '2024-01-15T10:01:00.000Z',
        },
        {
          id: ps1DedupId,
          role: 'pathseeker-dedup',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [ps1SurfaceId],
          createdAt: '2024-01-15T10:02:00.000Z',
        },
        {
          id: ps1AcId,
          role: 'pathseeker-assertion-correctness',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [ps1SurfaceId],
          createdAt: '2024-01-15T10:02:01.000Z',
        },
        {
          id: ps1WalkId,
          role: 'pathseeker-walk',
          sessionId: mainSessionId,
          status: 'complete',
          dependsOn: [ps1DedupId, ps1AcId],
          createdAt: '2024-01-15T10:03:00.000Z',
        },
        {
          id: cwId,
          role: 'codeweaver',
          sessionId: mainSessionId,
          status: 'complete',
          relatedDataItems: ['steps/step-1'],
          dependsOn: [ps1WalkId],
          createdAt: '2024-01-15T10:04:00.000Z',
        },
        {
          id: wardFailedId,
          role: 'ward',
          sessionId: mainSessionId,
          status: 'failed',
          dependsOn: [cwId],
          createdAt: '2024-01-15T10:05:00.000Z',
        },
        {
          id: ps2SurfaceId,
          role: 'pathseeker-surface',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [wardFailedId],
          insertedBy: wardFailedId,
          createdAt: '2024-01-15T10:06:00.000Z',
        },
        {
          id: ps2DedupId,
          role: 'pathseeker-dedup',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [ps2SurfaceId],
          createdAt: '2024-01-15T10:07:00.000Z',
        },
        {
          id: ps2AcId,
          role: 'pathseeker-assertion-correctness',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [ps2SurfaceId],
          createdAt: '2024-01-15T10:07:01.000Z',
        },
        {
          id: crypto.randomUUID(),
          role: 'pathseeker-walk',
          sessionId: mainSessionId,
          status: 'pending',
          dependsOn: [ps2DedupId, ps2AcId],
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

    expect(floorTexts).toStrictEqual([
      'HOMEBASE',
      'ENTRANCE: MAPPING DUMPSTER',
      'FLOOR 1: FORGE',
      'FLOOR 2: MINI BOSS',
      'ENTRANCE: MAPPING DUMPSTER',
    ]);

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 1 })).toStrictEqual([
      '[PATHSEEKER-SURFACE]',
      '[PATHSEEKER-DEDUP]',
      '[PATHSEEKER-ASSERTION-CORRECTNESS]',
      '[PATHSEEKER-WALK]',
    ]);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 4 })).toStrictEqual([
      '[PATHSEEKER-SURFACE]',
      '[PATHSEEKER-DEDUP]',
      '[PATHSEEKER-ASSERTION-CORRECTNESS]',
      '[PATHSEEKER-WALK]',
    ]);
  });
});
