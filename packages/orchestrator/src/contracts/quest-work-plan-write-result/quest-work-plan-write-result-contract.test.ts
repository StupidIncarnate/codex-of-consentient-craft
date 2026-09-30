import { QuestWorkPlanWriteResultStub } from './quest-work-plan-write-result.stub';
import { questWorkPlanWriteResultContract } from './quest-work-plan-write-result-contract';

describe('questWorkPlanWriteResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestWorkPlanWriteResultStub();

      expect(questWorkPlanWriteResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {operationItemId: wrong type} => throws', () => {
      expect(() =>
        questWorkPlanWriteResultContract.parse({
          ...QuestWorkPlanWriteResultStub(),
          operationItemId: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
