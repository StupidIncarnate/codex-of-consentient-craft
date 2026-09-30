import { RecoverOrphanedWorkItemsLayerResultStub } from './recover-orphaned-work-items-layer-result.stub';
import { recoverOrphanedWorkItemsLayerResultContract } from './recover-orphaned-work-items-layer-result-contract';

describe('recoverOrphanedWorkItemsLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = RecoverOrphanedWorkItemsLayerResultStub();

      expect(recoverOrphanedWorkItemsLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {quest: wrong type} => throws', () => {
      expect(() =>
        recoverOrphanedWorkItemsLayerResultContract.parse({
          ...RecoverOrphanedWorkItemsLayerResultStub(),
          quest: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
