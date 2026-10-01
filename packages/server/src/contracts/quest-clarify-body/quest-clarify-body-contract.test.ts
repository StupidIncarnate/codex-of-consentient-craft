import { questClarifyBodyContract } from './quest-clarify-body-contract';
import { QuestClarifyBodyStub } from './quest-clarify-body.stub';

describe('questClarifyBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: stub default => parses successfully', () => {
      const result = QuestClarifyBodyStub();

      expect(result).toStrictEqual({
        answers: [{ header: 'q1', labels: ['a1'] }],
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
        answers: [{ header: 'q1', labels: ['a1'] }],
        questions: [],
      });

      expect(result).toStrictEqual({ answers: [{ header: 'q1', labels: ['a1'] }], questions: [] });
    });

    it('VALID: {labels: [Alpha, Gamma], text: prefer Gamma} => parses both labels and the text', () => {
      const result = questClarifyBodyContract.parse({
        answers: [{ header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' }],
        questions: [],
      });

      expect(result).toStrictEqual({
        answers: [{ header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' }],
        questions: [],
      });
    });

    it('VALID: {labels: [], text: my own answer} => parses a typed-only answer', () => {
      const result = questClarifyBodyContract.parse({
        answers: [{ header: 'Letters', labels: [], text: 'my own answer' }],
        questions: [],
      });

      expect(result).toStrictEqual({
        answers: [{ header: 'Letters', labels: [], text: 'my own answer' }],
        questions: [],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {answers: []} => throws validation error', () => {
      expect(() => {
        questClarifyBodyContract.parse({ answers: [], questions: [] });
      }).toThrow(/>=1/u);
    });

    it('INVALID: {answers: [{header only}]} => throws on the missing labels', () => {
      expect(() => {
        questClarifyBodyContract.parse({ answers: [{ header: 'q1' }], questions: [] });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {labels: [], no text} => throws because the answer has nothing to send', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [{ header: 'Letters', labels: [] }],
          questions: [],
        });
      }).toThrow(/A clarification answer needs at least one label or non-blank text/u);
    });

    it('INVALID: {labels: [], text: whitespace only} => throws because the text trims to empty', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [{ header: 'Letters', labels: [], text: '   ' }],
          questions: [],
        });
      }).toThrow(/>=1/u);
    });

    it('INVALID: {labels: [empty string]} => throws on the empty label', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [{ header: 'Letters', labels: [''] }],
          questions: [],
        });
      }).toThrow(/>=1/u);
    });

    it('INVALID: {questions: [{id, text}]} => throws on the malformed question', () => {
      expect(() => {
        questClarifyBodyContract.parse({
          answers: [{ header: 'q1', labels: ['a1'] }],
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
