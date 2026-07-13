import {
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  UrlSlugStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { ExecutionQueueGetAllResponder } from './execution-queue-get-all-responder';
import { ExecutionQueueGetAllResponderProxy } from './execution-queue-get-all-responder.proxy';

describe('ExecutionQueueGetAllResponder', () => {
  it('EMPTY: {no guilds} => returns []', async () => {
    const proxy = ExecutionQueueGetAllResponderProxy();
    proxy.setupNoGuilds();

    await expect(ExecutionQueueGetAllResponder()).resolves.toStrictEqual([]);
  });

  it('VALID: {in_progress quest on disk, nothing enqueued in memory} => derives the queue entry from disk with its live session', async () => {
    const proxy = ExecutionQueueGetAllResponderProxy();
    const guildSlug = UrlSlugStub({ value: 'my-guild' });
    const guild = GuildListItemStub({ urlSlug: guildSlug });
    const sessionId = SessionIdStub({ value: '9aadbf63-1111-4111-8111-111111111111' });
    const quest = QuestStub({
      id: QuestIdStub({ value: '4226b8d1-2827-4250-8d82-c278d66bcd2d' }),
      status: 'in_progress',
      createdAt: '2026-07-08T21:00:00.000Z',
      workItems: [
        WorkItemStub({ role: 'chaoswhisperer', status: 'complete' }),
        WorkItemStub({ role: 'codeweaver', status: 'in_progress', sessionId }),
      ],
    });
    proxy.setupActiveQuests({
      guildItems: [guild],
      questsByGuildId: [{ guildId: guild.id, quests: [quest] }],
    });

    await expect(ExecutionQueueGetAllResponder()).resolves.toStrictEqual([
      {
        questId: quest.id,
        guildId: guild.id,
        guildSlug,
        questTitle: quest.title,
        status: 'in_progress',
        enqueuedAt: quest.createdAt,
        activeSessionId: sessionId,
      },
    ]);
  });
});
