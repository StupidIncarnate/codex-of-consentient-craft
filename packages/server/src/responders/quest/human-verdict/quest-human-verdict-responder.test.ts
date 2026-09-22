import { HumanVerdictInputStub } from '../../../contracts/human-verdict-input/human-verdict-input.stub';
import { QuestHumanVerdictResponderProxy } from './quest-human-verdict-responder.proxy';

const QUEST_ID = 'add-auth';

describe('QuestHumanVerdictResponder', () => {
  describe('valid input', () => {
    it('VALID: {questId, unitId, outcome: met, reason} => returns 200 with { ok: true }', async () => {
      const proxy = QuestHumanVerdictResponderProxy();
      proxy.setupSucceeds();

      const result = await proxy.callResponder({
        params: { questId: QUEST_ID },
        body: HumanVerdictInputStub(),
      });

      expect(result).toStrictEqual({ status: 200, data: { ok: true } });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {body missing unitId} => returns 400 without calling the broker', async () => {
      const proxy = QuestHumanVerdictResponderProxy();
      const { unitId: _omittedUnitId, ...bodyWithoutUnitId } = HumanVerdictInputStub();

      const result = await proxy.callResponder({
        params: { questId: QUEST_ID },
        body: bodyWithoutUnitId,
      });

      expect(result).toStrictEqual({ status: 400, data: { error: 'Invalid human-verdict input' } });
    });

    it('EMPTY: {no questId in params or body} => returns 400, questId is required', async () => {
      const proxy = QuestHumanVerdictResponderProxy();
      const { questId: _omittedQuestId, ...bodyWithoutQuestId } = HumanVerdictInputStub();

      const result = await proxy.callResponder({ params: {}, body: bodyWithoutQuestId });

      expect(result).toStrictEqual({ status: 400, data: { error: 'Invalid human-verdict input' } });
    });
  });

  describe('the broker refuses', () => {
    it('ERROR: {broker throws} => returns 400 carrying the broker error message', async () => {
      const proxy = QuestHumanVerdictResponderProxy();
      proxy.setupThrows({
        message: 'Observable "motion-feels-smooth" on quest add-auth is not flagged verifyByHuman',
      });

      const result = await proxy.callResponder({
        params: { questId: QUEST_ID },
        body: HumanVerdictInputStub(),
      });

      expect(result).toStrictEqual({
        status: 400,
        data: {
          error: 'Observable "motion-feels-smooth" on quest add-auth is not flagged verifyByHuman',
        },
      });
    });
  });
});
