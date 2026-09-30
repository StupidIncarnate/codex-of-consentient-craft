import { UseQuestQueueResultStub } from './use-quest-queue-result.stub';
import { useQuestQueueResultContract } from './use-quest-queue-result-contract';

describe('useQuestQueueResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = UseQuestQueueResultStub();

      expect(useQuestQueueResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {activeEntry: wrong type} => throws', () => {
      expect(() =>
        useQuestQueueResultContract.parse({ ...UseQuestQueueResultStub(), activeEntry: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
