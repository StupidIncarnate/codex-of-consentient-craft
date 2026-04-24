import { GuildIdStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { OrchestrationDeleteResponderProxy } from './orchestration-delete-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const DELETE_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter((status) => {
  const meta = questStatusMetadataStatics.statuses[status];
  return meta.isTerminal || meta.isUserPaused || meta.isPreExecution;
});

const DELETE_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(DELETE_ALLOWED_STATUSES);

const DELETE_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !DELETE_ALLOWED_SET.has(status),
);

describe('OrchestrationDeleteResponder', () => {
  describe('allowed statuses', () => {
    it.each(DELETE_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns deleted true',
      async (status) => {
        const questId = QuestIdStub({ value: `delete-${status}` });
        const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
        const quest = QuestStub({ id: questId, status: status as never });
        const proxy = OrchestrationDeleteResponderProxy();
        proxy.setupQuestFound({ quest });

        const result = await proxy.callResponder({ questId, guildId });

        expect(result).toStrictEqual({ deleted: true });
      },
    );
  });

  describe('rejected statuses', () => {
    it.each(DELETE_REJECTED_STATUSES)(
      'INVALID: {status: %s} => throws status-gate error',
      async (status) => {
        const questId = QuestIdStub({ value: `delete-reject-${status}` });
        const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
        const quest = QuestStub({ id: questId, status: status as never });
        const proxy = OrchestrationDeleteResponderProxy();
        proxy.setupQuestFound({ quest });

        await expect(proxy.callResponder({ questId, guildId })).rejects.toThrow(
          /Quest must be in a terminal, paused, or pre-execution status to delete/u,
        );
      },
    );
  });

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const proxy = OrchestrationDeleteResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId, guildId })).rejects.toThrow(/Quest not found/u);
    });
  });
});
