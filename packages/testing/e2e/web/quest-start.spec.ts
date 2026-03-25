import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-start';
const HTTP_OK = 200;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest Start Pipeline', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('POST /api/quests/:questId/start returns processId and transitions quest to in_progress', async ({
    request,
  }) => {
    const quests = questHarness({ request });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Start Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-session-start-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Start Quest',
      userRequest: 'Build feature',
    });
    const { questId } = created;
    const questFilePath = String(Reflect.get(created, 'filePath'));
    const questFolder = String(Reflect.get(created, 'questFolder'));

    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath,
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
        },
      ],
    });

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
    const quests = questHarness({ request });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Pipeline Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-session-pipeline-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Pipeline Quest',
      userRequest: 'Build feature',
    });
    const { questId } = created;
    const questFilePath = String(Reflect.get(created, 'filePath'));
    const questFolder = String(Reflect.get(created, 'questFolder'));

    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath,
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
        },
      ],
    });

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
