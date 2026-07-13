import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-start';
const HTTP_OK = 200;

// A feature quest carries a Chaos-authored codeweaver operation item on its ledger; Start seeds the
// verify tail after it and marks it the first actionable operation.
const CODEWEAVER_OP_ID = '00000000-0000-4000-8000-0000000000c1';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest Start Pipeline', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: POST /api/quests/:questId/start returns processId and transitions quest to in_progress', async ({
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
    const questFilePath = created.filePath;
    const { questFolder } = created;

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
      operations: [
        {
          id: CODEWEAVER_OP_ID,
          role: 'codeweaver',
          text: 'core: build the feature',
          status: 'pending',
        },
      ],
    });

    const startResponse = await request.post(`/api/quests/${questId}/start`);

    expect(startResponse.status()).toBe(HTTP_OK);

    const startData = await startResponse.json();

    expect(startData.processId).toMatch(
      /^proc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
    );

    const questResponse = await request.get(`/api/quests/${questId}`);

    expect(questResponse.status()).toBe(HTTP_OK);

    const questData = await questResponse.json();

    // start-quest transitions an approved feature quest straight to in_progress and seeds the
    // operations relay (questBuildRelayGraphBroker): the Chaos-authored codeweaver plan item plus
    // the fixed verify tail, with the first actionable operation marked in_progress and its work
    // item created. The operations ledger IS the plan; dispatch begins immediately at in_progress.
    expect(questData.quest.status).toBe('in_progress');
    expect(
      questData.quest.operations.some((op: { role: string }) => op.role === 'codeweaver'),
    ).toBe(true);
    expect(
      questData.quest.workItems.every((wi: { role: string }) => wi.role !== 'pathseeker'),
    ).toBe(true);
  });

  test('VALID: POST /api/quests/:questId/start launches pipeline (process is registered)', async ({
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
    const questFilePath = created.filePath;
    const { questFolder } = created;

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

    expect({ processId: status.processId, questId: status.questId }).toStrictEqual({
      processId,
      questId,
    });
  });
});
