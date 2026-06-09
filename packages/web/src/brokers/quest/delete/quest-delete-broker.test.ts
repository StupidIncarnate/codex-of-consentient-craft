import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

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

    it('VALID: {questId, guildId} => issues DELETE to /api/quests/<questId>?guildId=<guildId>', async () => {
      const proxy = questDeleteBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupDelete();

      await questDeleteBroker({ questId, guildId });

      expect(proxy.getRequestMethod()).toBe('DELETE');
      expect(proxy.getRequestUrl()).toBe(
        '/api/quests/add-auth?guildId=f47ac10b-58cc-4372-a567-0e02b2c3d479',
      );
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => rejects', async () => {
      const proxy = questDeleteBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError();

      await expect(questDeleteBroker({ questId, guildId })).rejects.toThrow(/fetch/iu);
    });
  });
});
