import { transcriptRecordToolInputKeyContract } from './transcript-record-tool-input-key-contract';
import { TranscriptRecordToolInputKeyStub } from './transcript-record-tool-input-key.stub';

describe('transcriptRecordToolInputKeyContract', () => {
  describe('valid keys', () => {
    it('VALID: {value: "file_path"} => parses successfully', () => {
      const key = TranscriptRecordToolInputKeyStub({ value: 'file_path' });

      const result = transcriptRecordToolInputKeyContract.parse(key);

      expect(result).toBe('file_path');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => transcriptRecordToolInputKeyContract.parse(123)).toThrow(/expected string/u);
    });
  });
});
