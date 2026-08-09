import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questMergeBroker } from './quest-merge-broker';
import { questMergeBrokerProxy } from './quest-merge-broker.proxy';

describe('questMergeBroker', () => {
  describe('successful merge', () => {
    it('VALID: {questId} => resolves with merging', async () => {
      const proxy = questMergeBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupMerge({ merging: true });

      const result = await questMergeBroker({ questId });

      expect(result).toStrictEqual({ merging: true });
    });

    it('VALID: #merge-post-fired {questId} => sends exactly one POST to the merge route with no body', async () => {
      const proxy = questMergeBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupMerge({ merging: true });

      await questMergeBroker({ questId });

      expect(proxy.getRequestCount()).toBe(1);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questMergeBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(questMergeBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});
