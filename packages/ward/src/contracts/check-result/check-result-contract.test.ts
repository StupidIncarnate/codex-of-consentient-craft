import { checkResultContract } from './check-result-contract';
import { CheckResultStub } from './check-result.stub';

describe('checkResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {passing lint with no projects} => parses successfully', () => {
      const result = checkResultContract.parse(CheckResultStub());

      expect(result).toStrictEqual({
        checkType: 'lint',
        status: 'pass',
        projectResults: [],
      });
    });

    it('VALID: {failing typecheck with project results} => parses successfully', () => {
      const result = checkResultContract.parse(
        CheckResultStub({
          checkType: 'typecheck',
          status: 'fail',
          projectResults: [
            {
              projectFolder: { name: 'ward', path: '/path/ward' },
              status: 'fail',
              errors: [
                {
                  filePath: 'src/index.ts',
                  line: 1,
                  column: 1,
                  message: 'Type error',
                  severity: 'error',
                },
              ],
              testFailures: [],
              rawOutput: { stdout: '', stderr: 'error', exitCode: 1 },
            },
          ],
        }),
      );

      expect(result).toStrictEqual({
        checkType: 'typecheck',
        status: 'fail',
        projectResults: [
          {
            projectFolder: { name: 'ward', path: '/path/ward' },
            status: 'fail',
            errors: [
              {
                filePath: 'src/index.ts',
                line: 1,
                column: 1,
                message: 'Type error',
                severity: 'error',
              },
            ],
            testFailures: [],
            filesCount: 0,
            rawOutput: { stdout: '', stderr: 'error', exitCode: 1 },
          },
        ],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_CHECK_TYPE: {checkType: "unknown"} => throws validation error', () => {
      expect(() =>
        checkResultContract.parse({
          checkType: 'unknown',
          status: 'pass',
          projectResults: [],
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => checkResultContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid check result', () => {
      const result = CheckResultStub();

      expect(result).toStrictEqual({
        checkType: 'lint',
        status: 'pass',
        projectResults: [],
      });
    });

    it('VALID: {custom checkType} => creates check result with override', () => {
      const result = CheckResultStub({ checkType: 'unit', status: 'fail' });

      expect(result).toStrictEqual({
        checkType: 'unit',
        status: 'fail',
        projectResults: [],
      });
    });
  });
});
