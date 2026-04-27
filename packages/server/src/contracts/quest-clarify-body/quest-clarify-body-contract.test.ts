import { questClarifyBodyContract } from './quest-clarify-body-contract';
import { QuestClarifyBodyStub } from './quest-clarify-body.stub';

describe('questClarifyBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: stub default => parses successfully', () => {
      const result = QuestClarifyBodyStub();

      expect(result).toStrictEqual({
        answers: [{ header: 'q1', label: 'a1' }],
        questions: [{ id: 'q1', text: 'a question' }],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {answers: []} => throws validation error', () => {
      expect(() => {
        questClarifyBodyContract.parse({ answers: [], questions: [] });
      }).toThrow(/at least 1/u);
    });

    it('INVALID: {} => throws validation error', () => {
      expect(() => {
        questClarifyBodyContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
