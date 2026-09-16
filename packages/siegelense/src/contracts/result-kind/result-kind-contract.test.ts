import { resultsStatics } from '../../statics/results/results-statics';
import { resultKindContract } from './result-kind-contract';
import { ResultKindStub } from './result-kind.stub';

describe('resultKindContract', () => {
  describe('valid members', () => {
    it.each(resultsStatics.kinds.all)('VALID: {value: %s} => parses to itself', (value) => {
      const resultKind = ResultKindStub({ value });

      const result = resultKindContract.parse(resultKind);

      expect(result).toBe(value);
    });
  });

  describe('invalid members', () => {
    it("INVALID: {value: 'dom'} => a kind that does not exist yet throws validation error", () => {
      expect(() => {
        ResultKindStub({ value: 'dom' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
