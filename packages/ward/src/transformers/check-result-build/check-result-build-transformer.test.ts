import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { CheckTypeStub } from '../../contracts/check-type/check-type.stub';

import { checkResultBuildTransformer } from './check-result-build-transformer';

describe('checkResultBuildTransformer', () => {
  describe('all passing', () => {
    it('VALID: {all project results pass} => returns pass status', () => {
      const checkType = CheckTypeStub({ value: 'lint' });
      const projectResults = [ProjectResultStub({ status: 'pass' })];

      const result = checkResultBuildTransformer({ checkType, projectResults });

      expect(result).toStrictEqual(
        CheckResultStub({ checkType: 'lint', status: 'pass', projectResults }),
      );
    });
  });

  describe('any failing', () => {
    it('VALID: {one project result fails} => returns fail status', () => {
      const checkType = CheckTypeStub({ value: 'typecheck' });
      const projectResults = [
        ProjectResultStub({ status: 'pass' }),
        ProjectResultStub({ status: 'fail' }),
      ];

      const result = checkResultBuildTransformer({ checkType, projectResults });

      expect(result).toStrictEqual(
        CheckResultStub({ checkType: 'typecheck', status: 'fail', projectResults }),
      );
    });
  });

  describe('all skipped', () => {
    it('VALID: {all project results skip} => returns skip status', () => {
      const checkType = CheckTypeStub({ value: 'e2e' });
      const projectResults = [
        ProjectResultStub({ status: 'skip' }),
        ProjectResultStub({ status: 'skip' }),
      ];

      const result = checkResultBuildTransformer({ checkType, projectResults });

      expect(result).toStrictEqual(
        CheckResultStub({ checkType: 'e2e', status: 'skip', projectResults }),
      );
    });
  });

  describe('empty results', () => {
    it('EMPTY: {no project results} => returns pass status', () => {
      const checkType = CheckTypeStub({ value: 'unit' });

      const result = checkResultBuildTransformer({ checkType, projectResults: [] });

      expect(result).toStrictEqual(
        CheckResultStub({ checkType: 'unit', status: 'pass', projectResults: [] }),
      );
    });
  });
});
