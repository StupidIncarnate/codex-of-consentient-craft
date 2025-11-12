import { hookPostEditResponderResultContract } from './hook-post-edit-responder-result-contract';
import { LintResultStub } from '../lint-result/lint-result.stub';
import { MessageStub } from '../message/message.stub';

type LintResult = ReturnType<typeof LintResultStub>;

describe('hookPostEditResponderResultContract', () => {
  describe('with valid result data', () => {
    it('VALID: {violations: [], message: "message"} => parses successfully', () => {
      const violations: LintResult[] = [];
      const message = MessageStub({ value: 'No violations detected' });

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
      const message = MessageStub({ value: '1 file checked' });

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
    it('INVALID_VIOLATIONS: {violations: "not array", message: "msg"} => throws error', () => {
      expect(() =>
        hookPostEditResponderResultContract.parse({
          violations: 'not array' as never,
          message: 'test',
        }),
      ).toThrow(/Expected array/iu);
    });

    it('INVALID_MESSAGE: {violations: [], message: 123} => throws error', () => {
      expect(() =>
        hookPostEditResponderResultContract.parse({
          violations: [],
          message: 123 as never,
        }),
      ).toThrow(/Expected string/iu);
    });

    it('INVALID_MULTIPLE: {violations: "bad", message: 123} => throws error', () => {
      expect(() =>
        hookPostEditResponderResultContract.parse({
          violations: 'bad' as never,
          message: 123 as never,
        }),
      ).toThrow(/Expected/iu);
    });
  });
});
