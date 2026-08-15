import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questStartBroker } from './quest-start-broker';
import { questStartBrokerProxy } from './quest-start-broker.proxy';

describe('questStartBroker', () => {
  describe('successful start', () => {
    it('VALID: {questId} => resolves with processId', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupStart({ processId: 'proc-123' });

      const result = await questStartBroker({ questId });

      expect(result).toStrictEqual({ processId: 'proc-123' });
    });

    it('EDGE: {200 without processId} => throws naming the missing field', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupStartWithoutProcessId();

      await expect(questStartBroker({ questId })).rejects.toThrow(
        /^POST \/api\/quests\/add-auth\/start returned 200 with no processId$/u,
      );
    });
  });

  describe('400 rejection', () => {
    // The four rejections quest-start-responder can issue are indistinguishable once collapsed to
    // a status line, and the branch-name collision is the one a reader has no other way to
    // diagnose — it names a branch that an interrupted or overlapping Start already created.
    it('ERROR: {400 with the branch-name-taken body} => throws the exact server error text', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupRejected({
        error: 'quest/add-auth-7bc217a1 already exists — name is in use by other work',
      });

      await expect(questStartBroker({ questId })).rejects.toThrow(
        /^quest\/add-auth-7bc217a1 already exists — name is in use by other work$/u,
      );
    });

    it('ERROR: {400 with the not-startable body} => throws the exact server error text', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupRejected({
        error:
          'Quest must be in a startable status (approved or design_approved) to start execution',
      });

      await expect(questStartBroker({ questId })).rejects.toThrow(
        /^Quest must be in a startable status \(approved or design_approved\) to start execution$/u,
      );
    });

    it('EDGE: {400 with no body} => throws a generic status message', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupRejectedNoBody();

      await expect(questStartBroker({ questId })).rejects.toThrow(
        /^POST \/api\/quests\/add-auth\/start failed with status 400$/u,
      );
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questStartBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError();

      await expect(questStartBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });
});
