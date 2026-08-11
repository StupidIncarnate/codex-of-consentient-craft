import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questPauseBroker } from './quest-pause-broker';
import { questPauseBrokerProxy } from './quest-pause-broker.proxy';

describe('questPauseBroker', () => {
  describe('successful pause', () => {
    it('VALID: {questId} => resolves with paused true', async () => {
      const proxy = questPauseBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupPause();

      const result = await questPauseBroker({ questId });

      expect(result).toStrictEqual({ paused: true });
    });

    it('VALID: {questId} => sends exactly one bodyless POST to the pause route', async () => {
      const proxy = questPauseBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupPause();

      await questPauseBroker({ questId });

      // The questId travels in the URL, so the POST carries nothing to parse. A `{}` on the wire
      // records as `{}` here instead of the parse error and fails this assertion.
      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        { bodyParseError: 'SyntaxError: Unexpected end of JSON input' },
      ]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questPauseBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(questPauseBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});
