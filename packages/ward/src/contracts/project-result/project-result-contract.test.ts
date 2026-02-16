import { projectResultContract } from './project-result-contract';
import { ProjectResultStub } from './project-result.stub';

describe('projectResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {passing result with no errors} => parses successfully', () => {
      const result = projectResultContract.parse(ProjectResultStub());

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });
    });

    it('VALID: {failing result with errors} => parses successfully', () => {
      const result = projectResultContract.parse(
        ProjectResultStub({
          status: 'fail',
          errors: [
            {
              filePath: 'src/index.ts',
              line: 5,
              column: 1,
              message: 'Error found',
              severity: 'error',
            },
          ],
          rawOutput: { stdout: '', stderr: 'Error', exitCode: 1 },
        }),
      );

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'fail',
        errors: [
          {
            filePath: 'src/index.ts',
            line: 5,
            column: 1,
            message: 'Error found',
            severity: 'error',
          },
        ],
        testFailures: [],
        rawOutput: { stdout: '', stderr: 'Error', exitCode: 1 },
      });
    });

    it('VALID: {with test failures} => parses successfully', () => {
      const result = projectResultContract.parse(
        ProjectResultStub({
          status: 'fail',
          testFailures: [
            {
              suitePath: 'src/index.test.ts',
              testName: 'should work',
              message: 'Failed',
            },
          ],
        }),
      );

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'fail',
        errors: [],
        testFailures: [
          {
            suitePath: 'src/index.test.ts',
            testName: 'should work',
            message: 'Failed',
          },
        ],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });
    });

    it('VALID: {skip status} => parses successfully', () => {
      const result = projectResultContract.parse(ProjectResultStub({ status: 'skip' }));

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'skip',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_STATUS: {status: "unknown"} => throws validation error', () => {
      expect(() =>
        projectResultContract.parse({
          projectFolder: { name: 'ward', path: '/path' },
          status: 'unknown',
          errors: [],
          testFailures: [],
          rawOutput: { stdout: '', stderr: '', exitCode: 0 },
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => projectResultContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid project result', () => {
      const result = ProjectResultStub();

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });
    });
  });
});
