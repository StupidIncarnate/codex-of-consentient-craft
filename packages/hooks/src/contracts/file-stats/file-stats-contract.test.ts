import { fileStatsContract } from './file-stats-contract';
import { FileStatsStub } from './file-stats.stub';

describe('fileStatsContract', () => {
  describe('valid file stats', () => {
    it('VALID: {size: 1024} => parses successfully', () => {
      const stats = FileStatsStub({ size: 1024 });

      const result = fileStatsContract.parse({
        size: stats.size,
      });

      expect(result.size).toBe(1024);
    });

    it('VALID: {isFile, isDirectory} => includes function properties', () => {
      const stats = FileStatsStub();

      expect(stats.isFile?.()).toBe(true);
      expect(stats.isDirectory?.()).toBe(false);
    });
  });
});
