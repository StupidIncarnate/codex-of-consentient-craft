import { RunEvidenceComputeStub } from './run-evidence-compute.stub';
import { runEvidenceComputeContract } from './run-evidence-compute-contract';

describe('runEvidenceComputeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = RunEvidenceComputeStub();

      expect(runEvidenceComputeContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {runCount: wrong type} => throws', () => {
      expect(() =>
        runEvidenceComputeContract.parse({ ...RunEvidenceComputeStub(), runCount: 'nope' }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
