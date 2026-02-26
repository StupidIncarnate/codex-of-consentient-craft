import { pendingClarificationEntryContract } from './pending-clarification-entry-contract';
import { PendingClarificationEntryStub } from './pending-clarification-entry.stub';

describe('pendingClarificationEntryContract', () => {
  describe('parse', () => {
    it('VALID: {questId, questions} => returns validated entry', () => {
      const result = PendingClarificationEntryStub();

      expect(result).toStrictEqual({
        questId: 'add-auth',
        questions: [
          {
            question: 'Which approach do you prefer?',
            header: 'Architecture Choice',
            options: [
              { label: 'Option A', description: 'Use REST endpoints' },
              { label: 'Option B', description: 'Use GraphQL' },
            ],
            multiSelect: false,
          },
        ],
      });
    });

    it('VALID: {custom questId} => returns entry with overridden questId', () => {
      const result = PendingClarificationEntryStub({ questId: 'custom-quest' });

      expect(result).toStrictEqual({
        questId: 'custom-quest',
        questions: [
          {
            question: 'Which approach do you prefer?',
            header: 'Architecture Choice',
            options: [
              { label: 'Option A', description: 'Use REST endpoints' },
              { label: 'Option B', description: 'Use GraphQL' },
            ],
            multiSelect: false,
          },
        ],
      });
    });

    it('INVALID_QUESTIONS: {empty questions array} => throws validation error', () => {
      expect(() =>
        pendingClarificationEntryContract.parse({ questId: 'test', questions: [] }),
      ).toThrow(/too_small/u);
    });
  });
});
