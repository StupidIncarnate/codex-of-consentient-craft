import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questFollowupStopBroker } from './quest-followup-stop-broker';
import { questFollowupStopBrokerProxy } from './quest-followup-stop-broker.proxy';

describe('questFollowupStopBroker', () => {
  describe('successful stop', () => {
    it('VALID: {questId} => resolves with stopped true', async () => {
      const proxy = questFollowupStopBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      proxy.setupStopped();

      const result = await questFollowupStopBroker({ questId });

      expect(result).toStrictEqual({ stopped: true });
    });

    it('EMPTY: {nothing was running} => resolves with stopped false rather than throwing', async () => {
      const proxy = questFollowupStopBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      proxy.setupNothingRunning();

      const result = await questFollowupStopBroker({ questId });

      expect(result).toStrictEqual({ stopped: false });
    });

    it('VALID: {questId} => sends exactly one bodyless POST to the followup-stop route', async () => {
      const proxy = questFollowupStopBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      proxy.setupStopped();

      await questFollowupStopBroker({ questId });

      // The questId travels in the URL, so the POST carries nothing to parse. A `{}` on the wire
      // records as `{}` here instead of the parse error and fails this assertion. The count is
      // asserted alongside, because the route it hits is distinct from the followup POST's and a
      // broker aimed at the wrong one would record zero here.
      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        { bodyParseError: 'SyntaxError: Unexpected end of JSON input' },
      ]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questFollowupStopBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      proxy.setupError();

      await expect(questFollowupStopBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});
