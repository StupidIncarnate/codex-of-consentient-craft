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

    it('VALID: {run line with trailing duration suffix} => returns run ID without the suffix', () => {
      // Real ward CLI appends a total-duration suffix to the run line, e.g.
      // `run: 1780108054226-a080  (80.7s)` (see ward resultToSummaryTransformer). The run ID
      // must be extracted without the `  (80.7s)` tail so `ward detail <runId>` resolves it.
      const output = ErrorMessageStub({
        value: 'run: 1780108054226-a080  (80.7s)\nlint:      FAIL  1 packages',
      });

      const result = wardOutputToRunIdTransformer({ output });

      expect(result).toBe('1780108054226-a080');
    });
  });

  describe('output without run ID line', () => {
    it('EMPTY: {output with no run: prefix} => returns null', () => {
      const output = ErrorMessageStub({
        value: 'Some error output without run id',
      });

      const result = wardOutputToRunIdTransformer({ output });

      expect(result).toBe(null);
    });

    it('EMPTY: {empty output} => returns null', () => {
      const output = ErrorMessageStub({ value: '' });

      const result = wardOutputToRunIdTransformer({ output });

      expect(result).toBe(null);
    });
  });
});
