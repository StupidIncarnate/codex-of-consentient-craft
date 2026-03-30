import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-pause';
const HTTP_OK = 200;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest Pause and Resume', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: POST /api/quests/:questId/pause transitions quest to blocked and resets in_progress work items', async ({
    request,
  }) => {
    const quests = questHarness({ request });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Pause Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-session-pause-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Pause Quest',
      userRequest: 'Build feature',
    });
    const { questId } = created;
    const questFilePath = created.filePath;
    const { questFolder } = created;

    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath,
      status: 'in_progress',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
        },
        {
          id: 'e2e00000-0000-4000-8000-000000000002',
          role: 'codeweaver',
          status: 'in_progress',
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

  test('EDGE: pause then resume via PATCH unblocks quest status', async ({ request }) => {
    const quests = questHarness({ request });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Resume Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-session-resume-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Resume Quest',
      userRequest: 'Build feature',
    });
    const { questId } = created;
    const questFilePath = created.filePath;
    const { questFolder } = created;

    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath,
      status: 'in_progress',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
        },
      ],
    });

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

    expect(resumedData.quest.status).toBe('in_progress');
  });
});
