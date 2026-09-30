import { ReadFirstExistingCandidateLayerResultStub } from './read-first-existing-candidate-layer-result.stub';
import { readFirstExistingCandidateLayerResultContract } from './read-first-existing-candidate-layer-result-contract';

describe('readFirstExistingCandidateLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ReadFirstExistingCandidateLayerResultStub();

      expect(readFirstExistingCandidateLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {filePath: wrong type} => throws', () => {
      expect(() =>
        readFirstExistingCandidateLayerResultContract.parse({
          ...ReadFirstExistingCandidateLayerResultStub(),
          filePath: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
