import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { sessionClarifyBodyContract } from './session-clarify-body-contract';
import { SessionClarifyBodyStub } from './session-clarify-body.stub';

describe('sessionClarifyBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: stub data => parses successfully and returns first answer', () => {
      const guildId = GuildIdStub();
      const questId = QuestIdStub();
      const result = SessionClarifyBodyStub({
        guildId,
        questId,
        answers: [{ id: 'a', answer: 'yes' }],
        questions: [],
      });

      expect(result).toStrictEqual({
        guildId,
        questId,
        answers: [{ id: 'a', answer: 'yes' }],
        questions: [],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {empty answers} => throws validation error', () => {
      expect(() => {
        SessionClarifyBodyStub({ answers: [] });
      }).toThrow(/at least 1/u);
    });

    it('INVALID: {missing fields} => throws validation error', () => {
      expect(() => {
        sessionClarifyBodyContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
