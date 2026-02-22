import { RunIdStub } from '../../contracts/run-id/run-id.stub';

import { extractChildRunIdTransformer } from './extract-child-run-id-transformer';

describe('extractChildRunIdTransformer', () => {
  describe('extracts', () => {
    it('VALID: {output with run: line} => returns RunId', () => {
      const result = extractChildRunIdTransformer({
        output: 'lint: PASS\nrun: 1739625600000-a3f1\nlint: 1 packages',
      });

      expect(result).toStrictEqual(RunIdStub({ value: '1739625600000-a3f1' }));
    });

    it('VALID: {output with only run: line} => returns RunId', () => {
      const result = extractChildRunIdTransformer({
        output: 'run: 1771741106262-1b29',
      });

      expect(result).toStrictEqual(RunIdStub({ value: '1771741106262-1b29' }));
    });
  });

  describe('returns null', () => {
    it('EMPTY: {empty output} => returns null', () => {
      const result = extractChildRunIdTransformer({ output: '' });

      expect(result).toBeNull();
    });

    it('MISSING: {output without run: line} => returns null', () => {
      const result = extractChildRunIdTransformer({
        output: 'lint: PASS\ntypecheck: PASS',
      });

      expect(result).toBeNull();
    });

    it('INVALID: {run: line with invalid format} => returns null', () => {
      const result = extractChildRunIdTransformer({
        output: 'run: not-a-valid-id',
      });

      expect(result).toBeNull();
    });
  });
});
