import { ObservableIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questHumanVerdictBroker } from './quest-human-verdict-broker';
import { questHumanVerdictBrokerProxy } from './quest-human-verdict-broker.proxy';

describe('questHumanVerdictBroker', () => {
  describe('successful recording', () => {
    it('VALID: {questId, unitId, outcome: met, reason} => resolves with { ok: true }', async () => {
      const proxy = questHumanVerdictBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const unitId = ObservableIdStub({ value: 'motion-feels-smooth' });

      proxy.setupRecorded();

      const result = await questHumanVerdictBroker({
        questId,
        unitId,
        outcome: 'met',
        reason: 'Watched the raid transition end to end — it never stutters.',
      });

      expect(result).toStrictEqual({ ok: true });
    });

    it('VALID: {questId, unitId, outcome, reason} => posts exactly that body, questId in the URL only', async () => {
      const proxy = questHumanVerdictBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const unitId = ObservableIdStub({ value: 'motion-feels-smooth' });

      proxy.setupRecorded();

      await questHumanVerdictBroker({
        questId,
        unitId,
        outcome: 'met',
        reason: 'Watched the raid transition end to end — it never stutters.',
      });

      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        {
          unitId: 'motion-feels-smooth',
          outcome: 'met',
          reason: 'Watched the raid transition end to end — it never stutters.',
        },
      ]);
    });

    it('VALID: {outcome: not-met} => posts the rejection outcome', async () => {
      const proxy = questHumanVerdictBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const unitId = ObservableIdStub({ value: 'motion-feels-smooth' });

      proxy.setupRecorded();

      await questHumanVerdictBroker({
        questId,
        unitId,
        outcome: 'not-met',
        reason: 'Visibly janky.',
      });

      await expect(proxy.getRequestBodies()).resolves.toStrictEqual([
        { unitId: 'motion-feels-smooth', outcome: 'not-met', reason: 'Visibly janky.' },
      ]);
    });
  });

  describe('server refuses', () => {
    it('ERROR: {400, error} => throws with the server message', async () => {
      const proxy = questHumanVerdictBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const unitId = ObservableIdStub({ value: 'motion-feels-smooth' });

      proxy.setupRefused({
        error: 'Observable "motion-feels-smooth" on quest add-auth is not flagged verifyByHuman',
      });

      await expect(
        questHumanVerdictBroker({ questId, unitId, outcome: 'met', reason: 'Watched it.' }),
      ).rejects.toThrow(/is not flagged verifyByHuman/u);
    });

    it('ERROR: {400, no body} => throws the generic status message', async () => {
      const proxy = questHumanVerdictBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const unitId = ObservableIdStub({ value: 'motion-feels-smooth' });

      proxy.setupBadRequestNoBody();

      await expect(
        questHumanVerdictBroker({ questId, unitId, outcome: 'met', reason: 'Watched it.' }),
      ).rejects.toThrow(/failed with status 400/u);
    });

    it('ERROR: {400, body claims ok: true} => throws, the status is the authority over the body', async () => {
      const proxy = questHumanVerdictBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const unitId = ObservableIdStub({ value: 'motion-feels-smooth' });

      proxy.setupBadRequestOkBody();

      await expect(
        questHumanVerdictBroker({ questId, unitId, outcome: 'met', reason: 'Watched it.' }),
      ).rejects.toThrow(/failed with status 400/u);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws error', async () => {
      const proxy = questHumanVerdictBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const unitId = ObservableIdStub({ value: 'motion-feels-smooth' });

      proxy.setupNetworkError();

      await expect(
        questHumanVerdictBroker({ questId, unitId, outcome: 'met', reason: 'Watched it.' }),
      ).rejects.toThrow(/fetch/iu);
    });
  });
});
