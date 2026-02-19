import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { countFailingFilesTransformer } from './count-failing-files-transformer';

describe('countFailingFilesTransformer', () => {
  describe('no failures', () => {
    it('VALID: {projectResult: no errors or failures} => returns 0', () => {
      const projectResult = ProjectResultStub({ errors: [], testFailures: [] });

      const result = countFailingFilesTransformer({ projectResult });

      expect(result).toBe(0);
    });
  });

  describe('errors only', () => {
    it('VALID: {projectResult: 2 errors in same file} => returns 1', () => {
      const projectResult = ProjectResultStub({
        errors: [
          ErrorEntryStub({ filePath: 'src/a.ts' }),
          ErrorEntryStub({ filePath: 'src/a.ts', line: 20 }),
        ],
      });

      const result = countFailingFilesTransformer({ projectResult });

      expect(result).toBe(1);
    });

    it('VALID: {projectResult: errors in different files} => returns unique count', () => {
      const projectResult = ProjectResultStub({
        errors: [
          ErrorEntryStub({ filePath: 'src/a.ts' }),
          ErrorEntryStub({ filePath: 'src/b.ts' }),
        ],
      });

      const result = countFailingFilesTransformer({ projectResult });

      expect(result).toBe(2);
    });
  });

  describe('test failures only', () => {
    it('VALID: {projectResult: 2 failures in same suite} => returns 1', () => {
      const projectResult = ProjectResultStub({
        testFailures: [
          TestFailureStub({ suitePath: 'src/a.test.ts', testName: 'test1' }),
          TestFailureStub({ suitePath: 'src/a.test.ts', testName: 'test2' }),
        ],
      });

      const result = countFailingFilesTransformer({ projectResult });

      expect(result).toBe(1);
    });
  });

  describe('mixed errors and failures', () => {
    it('VALID: {projectResult: error and failure in different files} => returns 2', () => {
      const projectResult = ProjectResultStub({
        errors: [ErrorEntryStub({ filePath: 'src/a.ts' })],
        testFailures: [TestFailureStub({ suitePath: 'src/b.test.ts' })],
      });

      const result = countFailingFilesTransformer({ projectResult });

      expect(result).toBe(2);
    });
  });
});
