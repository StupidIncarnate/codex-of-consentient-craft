import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';

import { foldProjectResultIntoChecksTransformer } from './fold-project-result-into-checks-transformer';

describe('foldProjectResultIntoChecksTransformer', () => {
  describe('no extra result', () => {
    it('EMPTY: {extraProjectResult: undefined} => returns the checks array unchanged', () => {
      const checks = [CheckResultStub({ checkType: 'lint', status: 'pass', projectResults: [] })];

      const result = foldProjectResultIntoChecksTransformer({
        checks,
        checkType: 'lint',
      });

      expect(result).toBe(checks);
    });
  });

  describe('matching check type', () => {
    it('VALID: {extra result fails, lint currently passes} => lint flips to fail and carries both project results', () => {
      const passingProjectResult = ProjectResultStub({
        projectFolder: { name: 'web', path: '/repo/packages/web' },
        status: 'pass',
      });
      const failingExtra = ProjectResultStub({
        projectFolder: { name: '(platform + dedupe)', path: '/repo' },
        status: 'fail',
        errors: [
          {
            filePath: 'web',
            line: 0,
            column: 0,
            message: 'a platform crossing',
            severity: 'error',
          },
        ],
      });
      const checks = [
        CheckResultStub({
          checkType: 'lint',
          status: 'pass',
          projectResults: [passingProjectResult],
        }),
        CheckResultStub({ checkType: 'typecheck', status: 'pass', projectResults: [] }),
      ];

      const result = foldProjectResultIntoChecksTransformer({
        checks,
        checkType: 'lint',
        extraProjectResult: failingExtra,
      });

      expect(result).toStrictEqual([
        {
          checkType: 'lint',
          status: 'fail',
          durationMs: 0,
          projectResults: [passingProjectResult, failingExtra],
        },
        {
          checkType: 'typecheck',
          status: 'pass',
          durationMs: 0,
          projectResults: [],
        },
      ]);
    });

    it('VALID: {extra result passes with no errors} => lint stays pass and carries both project results', () => {
      const passingProjectResult = ProjectResultStub({
        projectFolder: { name: 'web', path: '/repo/packages/web' },
        status: 'pass',
      });
      const passingExtra = ProjectResultStub({
        projectFolder: { name: '(platform + dedupe)', path: '/repo' },
        status: 'pass',
      });
      const checks = [
        CheckResultStub({
          checkType: 'lint',
          status: 'pass',
          projectResults: [passingProjectResult],
        }),
      ];

      const result = foldProjectResultIntoChecksTransformer({
        checks,
        checkType: 'lint',
        extraProjectResult: passingExtra,
      });

      expect(result).toStrictEqual([
        {
          checkType: 'lint',
          status: 'pass',
          durationMs: 0,
          projectResults: [passingProjectResult, passingExtra],
        },
      ]);
    });
  });

  describe('no matching check type', () => {
    it('INVALID: {checkType is typecheck, checks holds only lint} => returns checks unchanged', () => {
      const checks = [CheckResultStub({ checkType: 'lint', status: 'pass', projectResults: [] })];
      const extra = ProjectResultStub({ status: 'fail', errors: [] });

      const result = foldProjectResultIntoChecksTransformer({
        checks,
        checkType: 'typecheck',
        extraProjectResult: extra,
      });

      expect(result).toStrictEqual(checks);
    });
  });
});
