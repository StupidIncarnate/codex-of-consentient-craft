import { transcriptRecordUsageKeyContract } from './transcript-record-usage-key-contract';
import { TranscriptRecordUsageKeyStub } from './transcript-record-usage-key.stub';

describe('transcriptRecordUsageKeyContract', () => {
  describe('valid keys', () => {
    it('VALID: {value: "input_tokens"} => parses successfully', () => {
      const key = TranscriptRecordUsageKeyStub({ value: 'input_tokens' });

      const result = transcriptRecordUsageKeyContract.parse(key);

      expect(result).toBe('input_tokens');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => transcriptRecordUsageKeyContract.parse(123 as never)).toThrow(
        /expected string/u,
      );
    });
  });
});
