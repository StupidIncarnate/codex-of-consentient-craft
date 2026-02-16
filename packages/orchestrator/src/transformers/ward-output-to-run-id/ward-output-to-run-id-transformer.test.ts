import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { wardOutputToRunIdTransformer } from './ward-output-to-run-id-transformer';

describe('wardOutputToRunIdTransformer', () => {
  describe('output with run ID line', () => {
    it('VALID: {output with run: prefix on first line} => returns run ID as FileName', () => {
      const output = ErrorMessageStub({
        value: 'run: 1739625600000-a3f1\nlint:      PASS  10 packages',
      });

      const result = wardOutputToRunIdTransformer({ output });

      expect(result).toBe('1739625600000-a3f1');
    });

    it('VALID: {output with run: on non-first line} => returns run ID', () => {
      const output = ErrorMessageStub({
        value: 'some prefix\nrun: 1739625600000-b2e4\nlint:      FAIL',
      });

      const result = wardOutputToRunIdTransformer({ output });

      expect(result).toBe('1739625600000-b2e4');
    });

    it('VALID: {output with only run line} => returns run ID', () => {
      const output = ErrorMessageStub({
        value: 'run: 1700000000000-dead',
      });

      const result = wardOutputToRunIdTransformer({ output });

      expect(result).toBe('1700000000000-dead');
    });
  });

  describe('output without run ID line', () => {
    it('EMPTY: {output with no run: prefix} => returns null', () => {
      const output = ErrorMessageStub({
        value: 'Some error output without run id',
      });

      const result = wardOutputToRunIdTransformer({ output });

      expect(result).toBeNull();
    });

    it('EMPTY: {empty output} => returns null', () => {
      const output = ErrorMessageStub({ value: '' });

      const result = wardOutputToRunIdTransformer({ output });

      expect(result).toBeNull();
    });
  });
});
