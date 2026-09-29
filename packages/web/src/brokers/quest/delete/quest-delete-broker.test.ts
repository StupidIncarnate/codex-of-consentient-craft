import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

import { questDeleteBroker } from './quest-delete-broker';
import { questDeleteBrokerProxy } from './quest-delete-broker.proxy';

describe('questDeleteBroker', () => {
  describe('successful delete', () => {
    it('VALID: {questId, guildId} => resolves with deleted true', async () => {
      const proxy = questDeleteBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupDelete();

      const result = await questDeleteBroker({ questId, guildId });

      expect(result).toStrictEqual({ deleted: true });
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => rejects', async () => {
      const proxy = questDeleteBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError();

      const caught: unknown = await questDeleteBroker({ questId, guildId }).catch(
        (rejection: unknown) => rejection,
      );
      const error = caught as Error;

      expect(error.message).toBe('Failed to fetch');
    });
  });
});
