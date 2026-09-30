import { questClarifyBodyContract } from './quest-clarify-body-contract';
import { QuestClarifyBodyStub } from './quest-clarify-body.stub';

describe('questClarifyBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: stub default => parses successfully', () => {
      const result = QuestClarifyBodyStub();

      expect(result).toStrictEqual({
        answers: [{ header: 'q1', label: 'a1' }],
        questions: [
          {
            question: 'a question',
            header: 'q1',
            options: [{ label: 'a1', description: 'first option' }],
            multiSelect: false,
          },
        ],
      });
    });

    it('VALID: {questions: []} => parses with no questions', () => {
      const result = questClarifyBodyContract.parse({
        answers: [{ header: 'q1', label: 'a1' }],
        questions: [],
      });

      expect(result).toStrictEqual({ answers: [{ header: 'q1', label: 'a1' }], questions: [] });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {answers: []} => throws validation error', () => {
      expect(() => {
        questClarifyBodyContract.parse({ answers: [], questions: [] });
      }).toThrow(/>=1/u);
    });

    it('INVALID: {answers: [{header only}]} => throws on the missing label', () => {
      expect(() => {
        questClarifyBodyContract.parse({ answers: [{ header: 'q1' }], questions: [] });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {questions: [{id, text}]} => throws on the malformed question', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [{ header: 'q1', label: 'a1' }],
          questions: [{ id: 'q1', text: 'a question' }],
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {} => throws validation error', () => {
      expect(() => {
        questClarifyBodyContract.parse({});
      }).toThrow(/received undefined/u);
    });
  });
});
