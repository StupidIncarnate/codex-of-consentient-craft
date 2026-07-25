import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';

import { isCrashedProjectResultGuard } from './is-crashed-project-result-guard';

describe('isCrashedProjectResultGuard', () => {
  describe('crashed', () => {
    it('VALID: {status fail, no errors, no test failures} => returns true', () => {
      const projectResult = ProjectResultStub({ status: 'fail' });

      const result = isCrashedProjectResultGuard({ projectResult });

      expect(result).toBe(true);
    });
  });

  describe('not crashed', () => {
    it('VALID: {status fail with errors} => returns false', () => {
      const projectResult = ProjectResultStub({ status: 'fail', errors: [ErrorEntryStub()] });

      const result = isCrashedProjectResultGuard({ projectResult });

      expect(result).toBe(false);
    });

    it('VALID: {status fail with test failures} => returns false', () => {
      const projectResult = ProjectResultStub({
        status: 'fail',
        testFailures: [TestFailureStub()],
      });

      const result = isCrashedProjectResultGuard({ projectResult });

      expect(result).toBe(false);
    });

    it('VALID: {status pass} => returns false', () => {
      const projectResult = ProjectResultStub({ status: 'pass' });

      const result = isCrashedProjectResultGuard({ projectResult });

      expect(result).toBe(false);
    });

    it('VALID: {status skip} => returns false', () => {
      const projectResult = ProjectResultStub({ status: 'skip' });

      const result = isCrashedProjectResultGuard({ projectResult });

      expect(result).toBe(false);
    });
  });

  describe('missing input', () => {
    it('EMPTY: {no projectResult} => returns false', () => {
      const result = isCrashedProjectResultGuard({});

      expect(result).toBe(false);
    });
  });
});
