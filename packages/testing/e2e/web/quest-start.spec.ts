import { mkdirSync, writeFileSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  createSessionFile,
  cleanSessionDirectory,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-start';
const JSON_INDENT = 2;
const HTTP_OK = 200;

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

    const created = await createQuest(request, {
      guildId,
      title: 'E2E Start Quest',
      userRequest: 'Build feature',
    });
    const questId = created.questId;
    const questFilePath = String(Reflect.get(created, 'filePath'));
    const questFolder = String(Reflect.get(created, 'questFolder'));

    const quest = {
      id: questId,
      folder: questFolder,
      title: 'E2E Start Quest',
      status: 'approved',
      createdAt: new Date().toISOString(),
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
      ],
      userRequest: 'Build feature',
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
    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));

    const startResponse = await request.post(`/api/quests/${questId}/start`);
    expect(startResponse.status()).toBe(HTTP_OK);
    const startData = await startResponse.json();
    expect(startData.processId).toBeTruthy();

    const questResponse = await request.get(`/api/quests/${questId}`);
    expect(questResponse.status()).toBe(HTTP_OK);
    const questData = await questResponse.json();
    expect(questData.quest.status).toBe('in_progress');
  });

  test('POST /api/quests/:questId/start launches pipeline (process is registered)', async ({
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Pipeline Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-session-pipeline-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build feature' });

    const created = await createQuest(request, {
      guildId,
      title: 'E2E Pipeline Quest',
      userRequest: 'Build feature',
    });
    const questId = created.questId;
    const questFilePath = String(Reflect.get(created, 'filePath'));
    const questFolder = String(Reflect.get(created, 'questFolder'));

    const quest = {
      id: questId,
      folder: questFolder,
      title: 'E2E Pipeline Quest',
      status: 'approved',
      createdAt: new Date().toISOString(),
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
      ],
      userRequest: 'Build feature',
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
    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));

    const startResponse = await request.post(`/api/quests/${questId}/start`);
    expect(startResponse.status()).toBe(HTTP_OK);
    const { processId } = await startResponse.json();

    const statusResponse = await request.get(`/api/process/${processId}`);
    expect(statusResponse.status()).toBe(HTTP_OK);
    const status = await statusResponse.json();
    expect(status.processId).toBe(processId);
    expect(status.questId).toBe(questId);
  });
});
