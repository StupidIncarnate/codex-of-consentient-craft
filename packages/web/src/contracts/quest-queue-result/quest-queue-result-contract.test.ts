import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import { questQueueResultContract } from './quest-queue-result-contract';
import { QuestQueueResultStub } from './quest-queue-result.stub';

describe('questQueueResultContract', () => {
  describe('valid results', () => {
    it('VALID: {default stub} => parses to an empty queue', () => {
      const result = questQueueResultContract.parse(QuestQueueResultStub());

      expect(result).toStrictEqual({ entries: [] });
    });

    it('VALID: {entries: [one]} => keeps the entry', () => {
      const entry = QuestQueueEntryStub({ questId: 'quest-1', questTitle: 'First' });

      const result = questQueueResultContract.parse(QuestQueueResultStub({ entries: [entry] }));

      expect(result).toStrictEqual({ entries: [entry] });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {entries: [{bad}]} => throws validation error', () => {
      expect(() => questQueueResultContract.parse({ entries: [{ bad: 'data' }] })).toThrow(
        /entries/u,
      );
    });

    it('INVALID: {missing entries} => throws validation error', () => {
      expect(() => questQueueResultContract.parse({})).toThrow(/entries/u);
    });
  });
});
