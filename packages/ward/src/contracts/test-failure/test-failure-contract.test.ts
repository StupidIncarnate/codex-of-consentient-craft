import { testFailureContract } from './test-failure-contract';
import { TestFailureStub } from './test-failure.stub';

describe('testFailureContract', () => {
  describe('valid inputs', () => {
    it('VALID: {full test failure with stack trace} => parses successfully', () => {
      const result = testFailureContract.parse(
        TestFailureStub({ stackTrace: 'Error\n  at Object.<anonymous>' }),
      );

      expect(result).toStrictEqual({
        suitePath: 'src/index.test.ts',
        testName: 'should return valid result',
        message: 'Expected true to be false',
        stackTrace: 'Error\n  at Object.<anonymous>',
      });
    });

    it('VALID: {without stack trace} => parses without optional field', () => {
      const result = testFailureContract.parse({
        suitePath: 'src/app.test.ts',
        testName: 'handles error',
        message: 'Timeout',
      });

      expect(result).toStrictEqual({
        suitePath: 'src/app.test.ts',
        testName: 'handles error',
        message: 'Timeout',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SUITE_PATH: {suitePath: number} => throws validation error', () => {
      expect(() =>
        testFailureContract.parse({
          suitePath: 123 as never,
          testName: 'test',
          message: 'msg',
        }),
      ).toThrow(/Expected string/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => testFailureContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid test failure', () => {
      const result = TestFailureStub();

      expect(result).toStrictEqual({
        suitePath: 'src/index.test.ts',
        testName: 'should return valid result',
        message: 'Expected true to be false',
      });
    });

    it('VALID: {custom values} => creates test failure with overrides', () => {
      const result = TestFailureStub({
        suitePath: 'src/other.test.ts',
        testName: 'custom test',
        message: 'custom message',
        stackTrace: 'stack',
      });

      expect(result).toStrictEqual({
        suitePath: 'src/other.test.ts',
        testName: 'custom test',
        message: 'custom message',
        stackTrace: 'stack',
      });
    });
  });
});
