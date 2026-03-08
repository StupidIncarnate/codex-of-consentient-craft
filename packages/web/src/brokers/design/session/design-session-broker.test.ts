import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { designSessionBroker } from './design-session-broker';
import { designSessionBrokerProxy } from './design-session-broker.proxy';

describe('designSessionBroker', () => {
  describe('successful session start', () => {
    it('VALID: {questId, guildId, message} => returns chatProcessId', async () => {
      const proxy = designSessionBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-design-1' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Begin design prototyping' });
      const processId = ProcessIdStub({ value: 'design-proc-123' });

      proxy.setupSession({ chatProcessId: processId });

      const result = await designSessionBroker({ questId, guildId, message });

      expect(result).toStrictEqual({ chatProcessId: processId });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = designSessionBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-design-1' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Begin design prototyping' });

      proxy.setupError();

      await expect(designSessionBroker({ questId, guildId, message })).rejects.toThrow(/fetch/iu);
    });
  });
});
