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

const GUILD_PATH = '/tmp/dm-e2e-quest-start';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const POLL_INTERVAL_MS = 250;
const MAX_POLLS = 40;

const createQuestFile = ({
  guildId,
  questId,
  sessionId,
  status,
}: {
  guildId: string;
  questId: string;
  sessionId: string;
  status: string;
}): void => {
  const homeDir = os.homedir();
  const questFolder = '001-e2e-start';
  const questDir = path.join(homeDir, '.dungeonmaster', 'guilds', guildId, 'quests', questFolder);
  mkdirSync(questDir, { recursive: true });

  const quest = {
    id: questId,
    folder: questFolder,
    title: 'E2E Start Quest',
    status,
    createdAt: new Date().toISOString(),
    questCreatedSessionBy: sessionId,
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

test.describe('Quest Start Pipeline', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('POST /api/quests/:questId/start returns processId and transitions quest to in_progress', async ({
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Start Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-session-start-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build feature' });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId, status: 'approved' });

    const startResponse = await request.post(`/api/quests/${questId}/start`);
    expect(startResponse.status()).toBe(HTTP_OK);
    const startData = await startResponse.json();
    expect(startData.processId).toBeTruthy();

    const questResponse = await request.get(`/api/quests/${questId}`);
    expect(questResponse.status()).toBe(HTTP_OK);
    const questData = await questResponse.json();
    expect(questData.quest.status).toBe('in_progress');
  });

  test('POST /api/quests/:questId/start launches pipeline (phase moves beyond idle)', async ({
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Pipeline Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-session-pipeline-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build feature' });

    const questId = crypto.randomUUID();
    createQuestFile({ guildId, questId, sessionId, status: 'approved' });

    const startResponse = await request.post(`/api/quests/${questId}/start`);
    expect(startResponse.status()).toBe(HTTP_OK);
    const { processId } = await startResponse.json();

    let phase = 'idle';
    for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
      const statusResponse = await request.get(`/api/process/${processId}`);
      if (statusResponse.status() === HTTP_OK) {
        const status = await statusResponse.json();
        phase = String(status.phase);
        if (phase !== 'idle') break;
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, POLL_INTERVAL_MS);
      });
    }

    expect(phase).not.toBe('idle');
  });
});
