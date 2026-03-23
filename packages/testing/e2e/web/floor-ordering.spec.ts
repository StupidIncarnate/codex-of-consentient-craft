import * as crypto from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  clearClaudeQueue,
  cleanSessionDirectory,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-floor-ordering';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const PANEL_TIMEOUT = 15_000;
const CREATED_AT_INTERVAL_MS = 1000;

const writeQuestFile = ({
  questId,
  questFolder,
  questFilePath,
  status,
  workItems,
  steps = [],
}: {
  questId: string;
  questFolder: string;
  questFilePath: string;
  status: string;
  workItems: Array<{
    id: string;
    role: string;
    sessionId: string;
    status?: string;
    dependsOn?: string[];
    relatedDataItems?: string[];
    insertedBy?: string;
    createdAt?: string;
  }>;
  steps?: Array<{ id: string; name: string }>;
}): void => {
  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Floor Ordering Quest',
    status,
    createdAt: new Date().toISOString(),
    workItems: workItems.map((wi, index) => ({
      id: wi.id,
      role: wi.role,
      status: wi.status ?? 'complete',
      spawnerType: 'agent',
      sessionId: wi.sessionId,
      createdAt: wi.createdAt ?? new Date(Date.now() + index * CREATED_AT_INTERVAL_MS).toISOString(),
      relatedDataItems: wi.relatedDataItems ?? [],
      dependsOn: wi.dependsOn ?? [],
      attempt: 0,
      maxAttempts: 1,
      ...(wi.insertedBy ? { insertedBy: wi.insertedBy } : {}),
    })),
    userRequest: 'Build the feature',
    designDecisions: [],
    steps: steps.map((s) => ({
      id: s.id,
      name: s.name,
      description: 'Test step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      inputContracts: [],
      outputContracts: [],
    })),
    toolingRequirements: [],
    contracts: [],
    flows: [
      {
        id: 'floor-flow',
        name: 'Floor Ordering Flow',
        entryPoint: 'start',
        exitPoints: ['end'],
        nodes: [
          { id: 'start', label: 'Start', type: 'state', observables: [] },
          { id: 'end', label: 'End', type: 'terminal', observables: [] },
        ],
        edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
      },
    ],
    wardResults: [],
  };

  writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));
};

const createSessionFileForQuest = ({
  guildPath,
  sessionId,
}: {
  guildPath: string;
  sessionId: string;
}): void => {
  const homeDir = os.homedir();
  const encodedPath = guildPath.replace(/\//gu, '-');
  const jsonlDir = path.join(homeDir, '.claude', 'projects', encodedPath);
  const jsonlPath = path.join(jsonlDir, `${sessionId}.jsonl`);
  mkdirSync(jsonlDir, { recursive: true });
  const entry = JSON.stringify({
    type: 'user',
    message: { role: 'user', content: 'Build the feature' },
  });
  writeFileSync(jsonlPath, entry + '\n');
};

const navigateToSession = async ({
  page,
  urlSlug,
  sessionId,
}: {
  page: Parameters<Parameters<typeof test>[2]>[0]['page'];
  urlSlug: string;
  sessionId: string;
}): Promise<void> => {
  const guildsResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
  );
  await page.goto(`/${urlSlug}/session/${sessionId}`);
  await guildsResponsePromise;
};

const getFloorHeaderTexts = async ({
  page,
}: {
  page: Parameters<Parameters<typeof test>[2]>[0]['page'];
}) => {
  const headers = page.getByTestId('floor-header-layer-widget');
  const count = await headers.count();
  const texts = [];
  for (let i = 0; i < count; i++) {
    const raw = (await headers.nth(i).textContent()) ?? '';
    texts.push(
      raw
        .replace(/──+/gu, '')
        .replace(/Concurrent.*$/u, '')
        .trim(),
    );
  }
  return texts;
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
  const result = [];
  for (let i = 0; i < badgeCount; i++) {
    const text = (await badges.nth(i).textContent()) ?? '';
    result.push(text.trim());
  }
  return result;
};

test.describe('Floor Ordering', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('happy path: floor headers in topological order with roles under correct headers', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Floor Order Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const mainSessionId = `e2e-floor-order-${Date.now()}`;

    createSessionFileForQuest({ guildPath: GUILD_PATH, sessionId: mainSessionId });

    const created = await createQuest(request, {
      guildId,
      title: 'E2E Floor Ordering Quest',
      userRequest: 'Build the feature',
    });
    const questId = created.questId;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

    const cwId = crypto.randomUUID();
    const wardId = crypto.randomUUID();

    writeQuestFile({
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

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

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

  test('ward fail → spiritmender → ward retry: FORGE before MINI BOSS, INFIRMARY between bosses', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Ward Retry Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const mainSessionId = `e2e-ward-retry-${Date.now()}`;

    createSessionFileForQuest({ guildPath: GUILD_PATH, sessionId: mainSessionId });

    const created = await createQuest(request, {
      guildId,
      title: 'E2E Floor Ordering Quest',
      userRequest: 'Build the feature',
    });
    const questId = created.questId;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

    const cwId = crypto.randomUUID();
    const wardId = crypto.randomUUID();
    const spiritId = crypto.randomUUID();

    writeQuestFile({
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

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

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

  test('siegemaster fail → pathseeker replan: CARTOGRAPHY after ARENA, skipped items hidden', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Siege Fail Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const mainSessionId = `e2e-siege-fail-${Date.now()}`;

    createSessionFileForQuest({ guildPath: GUILD_PATH, sessionId: mainSessionId });

    const created = await createQuest(request, {
      guildId,
      title: 'E2E Floor Ordering Quest',
      userRequest: 'Build the feature',
    });
    const questId = created.questId;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

    const cwId = crypto.randomUUID();
    const wardId = crypto.randomUUID();
    const siegeId = crypto.randomUUID();

    writeQuestFile({
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

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

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

    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 3 })).toStrictEqual([
      '[SIEGEMASTER]',
    ]);
    expect(await getRoleBadgesUnderFloor({ page, floorIndex: 4 })).toStrictEqual(['[PATHSEEKER]']);
  });
});
