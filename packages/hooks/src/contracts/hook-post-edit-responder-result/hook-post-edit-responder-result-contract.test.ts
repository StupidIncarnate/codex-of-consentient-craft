import { hookPostEditResponderResultContract } from './hook-post-edit-responder-result-contract';
import { LintResultStub } from '../lint-result/lint-result.stub';

type LintResult = ReturnType<typeof LintResultStub>;

describe('hookPostEditResponderResultContract', () => {
  describe('with valid result data', () => {
    it('VALID: {violations: [], message: "message"} => parses successfully', () => {
      const violations: LintResult[] = [];
      const message = 'No violations detected';

      const result = hookPostEditResponderResultContract.parse({
        violations,
        message,
      });

      expect(result).toStrictEqual({
        violations: [],
        message: 'No violations detected',
      });
    });

    it('VALID: {violations: [lintResult], message: "message"} => parses with violations', () => {
      const lintResult = LintResultStub({
        filePath: '/test.ts',
        messages: [],
        errorCount: 0,
        warningCount: 0,
      });
      const message = '1 file checked';

      const result = hookPostEditResponderResultContract.parse({
        violations: [lintResult],
        message,
      });

      expect(result).toStrictEqual({
        violations: [
          {
            filePath: '/test.ts',
            messages: [],
            errorCount: 0,
            warningCount: 0,
          },
        ],
        message: '1 file checked',
      });
    });
  });

  describe('with invalid data', () => {
    it('INVALID: {violations: "not array", message: "msg"} => throws error', () => {
      expect(() =>
        hookPostEditResponderResultContract.parse({
          violations: 'not array',
          message: 'test',
        }),
      ).toThrow(/Expected array/iu);
    });

    it('INVALID: {violations: [], message: 123} => throws error', () => {
      expect(() =>
        hookPostEditResponderResultContract.parse({
          violations: [],
          message: 123,
        }),
      ).toThrow(/Expected string/iu);
    });

    it('INVALID: {violations: "bad", message: 123} => throws error', () => {
      expect(() =>
        hookPostEditResponderResultContract.parse({
          violations: 'bad',
          message: 123,
        }),
      ).toThrow(/Expected/iu);
    });
  });
});
