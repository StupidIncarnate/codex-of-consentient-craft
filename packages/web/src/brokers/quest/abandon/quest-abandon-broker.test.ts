import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questAbandonBroker } from './quest-abandon-broker';
import { questAbandonBrokerProxy } from './quest-abandon-broker.proxy';

describe('questAbandonBroker', () => {
  describe('successful abandon', () => {
    it('VALID: {questId} => resolves with abandoned true', async () => {
      const proxy = questAbandonBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupAbandon();

      const result = await questAbandonBroker({ questId });

      expect(result).toStrictEqual({ abandoned: true });
    });

    it('VALID: {questId} => sends exactly one bodyless POST to the abandon route', async () => {
      const proxy = questAbandonBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupAbandon();

      await questAbandonBroker({ questId });

      // The questId travels in the URL, so the POST carries nothing to parse. A `{}` on the wire
      // records as `{}` here instead of the parse error and fails this assertion.
      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        { bodyParseError: 'SyntaxError: Unexpected end of JSON input' },
      ]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questAbandonBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(questAbandonBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});
