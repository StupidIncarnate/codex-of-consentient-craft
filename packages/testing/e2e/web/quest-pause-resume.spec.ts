import * as crypto from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createSessionFile,
  cleanSessionDirectory,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-pause';
const JSON_INDENT = 2;
const HTTP_OK = 200;

const createQuestFile = ({
  guildId,
  questId,
  sessionId,
  status,
  workItems,
}: {
  guildId: string;
  questId: string;
  sessionId: string;
  status: string;
  workItems?: unknown[];
}): void => {
  const homeDir = os.homedir();
  const questFolder = '001-e2e-pause';
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Pause Quest',
    status,
    createdAt: new Date().toISOString(),
    workItems: workItems ?? [
      {
        id: 'e2e00000-0000-4000-8000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        spawnerType: 'agent',
        sessionId,
        createdAt: new Date().toISOString(),
        relatedDataItems: [],
        dependsOn: [],
      },
    ],
    userRequest: 'Build the feature',
    designDecisions: [],
    steps: [],
    toolingRequirements: [],
    contracts: [],
    flows: [
      {
        id: 'test-flow',
        name: 'Test Flow',
        entryPoint: 'start',
        exitPoints: ['end'],
        nodes: [
          { id: 'start', label: 'Start', type: 'state', observables: [] },
          { id: 'end', label: 'End', type: 'terminal', observables: [] },
        ],
        edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
      },
    ],
  };

  writeFileSync(path.join(questDir, 'quest.json'), JSON.stringify(quest, null, JSON_INDENT));
};

test.describe('Quest Pause and Resume', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('POST /api/quests/:questId/pause transitions quest to blocked and resets in_progress work items', async ({
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Pause Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-session-pause-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build feature' });

    const questId = crypto.randomUUID();
    createQuestFile({
      guildId,
      questId,
      sessionId,
      status: 'in_progress',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          status: 'complete',
          spawnerType: 'agent',
          sessionId,
          createdAt: new Date().toISOString(),
          relatedDataItems: [],
          dependsOn: [],
        },
        {
          id: 'e2e00000-0000-4000-8000-000000000002',
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          createdAt: new Date().toISOString(),
          relatedDataItems: [],
          dependsOn: ['e2e00000-0000-4000-8000-000000000001'],
        },
      ],
    });

    const pauseResponse = await request.post(`/api/quests/${questId}/pause`);
    expect(pauseResponse.status()).toBe(HTTP_OK);
    const pauseData = await pauseResponse.json();
    expect(pauseData.paused).toBe(true);

    const questResponse = await request.get(`/api/quests/${questId}`);
    expect(questResponse.status()).toBe(HTTP_OK);
    const questData = await questResponse.json();
    expect(questData.quest.status).toBe('blocked');

    const codeweaverItem = questData.quest.workItems.find(
      (wi: { id: string }) => wi.id === 'e2e00000-0000-4000-8000-000000000002',
    );
    expect(codeweaverItem.status).toBe('pending');
  });

  test('pause then resume via PATCH unblocks quest status', async ({ request }) => {
    const guild = await createGuild(request, { name: 'Resume Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-session-resume-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build feature' });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId, status: 'in_progress' });

    const pauseResponse = await request.post(`/api/quests/${questId}/pause`);
    expect(pauseResponse.status()).toBe(HTTP_OK);

    const blockedResponse = await request.get(`/api/quests/${questId}`);
    const blockedData = await blockedResponse.json();
    expect(blockedData.quest.status).toBe('blocked');

    const resumeResponse = await request.patch(`/api/quests/${questId}`, {
      data: { status: 'in_progress' },
    });
    expect(resumeResponse.status()).toBe(HTTP_OK);

    const resumedResponse = await request.get(`/api/quests/${questId}`);
    const resumedData = await resumedResponse.json();
    expect(resumedData.quest.status).not.toBe('blocked');
  });
});
