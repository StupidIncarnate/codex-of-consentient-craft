import { operationOwningQuestFindBroker } from './operation-owning-quest-find-broker';
import { operationOwningQuestFindBrokerProxy } from './operation-owning-quest-find-broker.proxy';
import { GuildListItemStub, OperationItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('operationOwningQuestFindBroker', () => {
  describe('an operation that exists on one quest', () => {
    it('VALID: {operationItemId} => returns the quest whose ledger contains it', async () => {
      const proxy = operationOwningQuestFindBrokerProxy();
      const operation = OperationItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const quest = QuestStub({ id: 'add-auth', operations: [operation] });
      proxy.succeeds({ guild: GuildListItemStub({ id: GUILD_ID }), quests: [quest] });

      const result = await operationOwningQuestFindBroker({ operationItemId: operation.id });

      expect(result.id).toBe('add-auth');
    });
  });

  describe('an operation no quest owns', () => {
    it('ERROR: {operationItemId not present anywhere} => throws naming it', async () => {
      const proxy = operationOwningQuestFindBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', operations: [] });
      proxy.succeeds({ guild: GuildListItemStub({ id: GUILD_ID }), quests: [quest] });

      await expect(
        operationOwningQuestFindBroker({
          operationItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as never,
        }),
      ).rejects.toThrow(
        /operationOwningQuestFindBroker: no quest owns operation f47ac10b-58cc-4372-a567-0e02b2c3d479/u,
      );
    });
  });
});
