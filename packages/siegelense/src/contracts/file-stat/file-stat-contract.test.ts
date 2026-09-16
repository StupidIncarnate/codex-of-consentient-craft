import { fileStatContract } from './file-stat-contract';
import { FileStatStub } from './file-stat.stub';

describe('fileStatContract', () => {
  describe('valid readings', () => {
    it('VALID: {sizeBytes: 2048, modifiedAtMs: 1700000000000} => parses and returns the validated FileStat', () => {
      const stat = FileStatStub({ sizeBytes: 2048, modifiedAtMs: 1_700_000_000_000 });

      const result = fileStatContract.parse(stat);

      expect(result).toStrictEqual({ sizeBytes: 2048, modifiedAtMs: 1_700_000_000_000 });
    });

    it('EDGE: {sizeBytes: 0} => parses an empty file', () => {
      const stat = FileStatStub({ sizeBytes: 0, modifiedAtMs: 1_700_000_000_000 });

      const result = fileStatContract.parse(stat);

      expect(result).toStrictEqual({ sizeBytes: 0, modifiedAtMs: 1_700_000_000_000 });
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {missing modifiedAtMs} => throws Required', () => {
      expect(() => fileStatContract.parse({ sizeBytes: 2048 })).toThrow(/Required/u);
    });

    it('INVALID: {sizeBytes: -1} => throws for a negative size', () => {
      expect(() =>
        fileStatContract.parse({ sizeBytes: -1, modifiedAtMs: 1_700_000_000_000 }),
      ).toThrow(/Number must be greater than or equal to 0/u);
    });
  });
});
