import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import { QuestsQueueResponderProxy } from './quests-queue-responder.proxy';

describe('QuestsQueueResponder', () => {
  describe('successful read', () => {
    it('VALID: {queue populated} => returns 200 with entries array', async () => {
      const proxy = QuestsQueueResponderProxy();
      const entry = QuestQueueEntryStub();
      proxy.setupQueue({ entries: [entry] });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({
        status: 200,
        data: { entries: [entry] },
      });
    });

    it('EMPTY: {queue empty} => returns 200 with empty entries array', async () => {
      const proxy = QuestsQueueResponderProxy();
      proxy.setupQueue({ entries: [] });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({
        status: 200,
        data: { entries: [] },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestsQueueResponderProxy();
      proxy.setupQueueError({ message: 'Queue read failed' });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Queue read failed' },
      });
    });
  });
});
