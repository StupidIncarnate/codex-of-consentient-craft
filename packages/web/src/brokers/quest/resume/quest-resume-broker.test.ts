import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

import { questResumeBroker } from './quest-resume-broker';
import { questResumeBrokerProxy } from './quest-resume-broker.proxy';

describe('questResumeBroker', () => {
  describe('successful resume', () => {
    it('VALID: {questId} => resolves with resumed true and restoredStatus', async () => {
      const proxy = questResumeBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupResume({ restoredStatus: 'in_progress' });

      const result = await questResumeBroker({ questId });

      expect(result).toStrictEqual({
        resumed: true,
        restoredStatus: 'in_progress',
        dispatch: { started: true },
      });
    });

    it('VALID: {questId} => sends exactly one bodyless POST to the resume route', async () => {
      const proxy = questResumeBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupResume({ restoredStatus: 'in_progress' });

      await questResumeBroker({ questId });

      // The questId travels in the URL, so the POST carries nothing to parse. A `{}` on the wire
      // records as `{}` here instead of the parse error and fails this assertion.
      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        { bodyParseError: 'SyntaxError: Unexpected end of JSON input' },
      ]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server answers 500} => throws naming the method, url, status and body', async () => {
      const proxy = questResumeBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupServerError();

      await expect(questResumeBroker({ questId })).rejects.toThrow(
        /^POST \/api\/quests\/add-auth\/resume failed with status 500: Internal Server Error$/u,
      );
    });

    it('ERROR: {network error} => throws error', async () => {
      const proxy = questResumeBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(questResumeBroker({ questId })).rejects.toThrow(/^Failed to fetch$/u);
    });
  });
});
