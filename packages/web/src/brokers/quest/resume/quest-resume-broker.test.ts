import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questResumeBroker } from './quest-resume-broker';
import { questResumeBrokerProxy } from './quest-resume-broker.proxy';

describe('questResumeBroker', () => {
  describe('successful resume', () => {
    it('VALID: {questId} => resolves with resumed true and restoredStatus', async () => {
      const proxy = questResumeBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupResume({ restoredStatus: 'seek_scope' });

      const result = await questResumeBroker({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'seek_scope' });
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questResumeBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(questResumeBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});
