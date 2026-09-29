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
    it('INVALID: {suitePath: number} => throws validation error', () => {
      expect(() =>
        testFailureContract.parse({
          suitePath: 123,
          testName: 'test',
          message: 'msg',
        }),
      ).toThrow(/expected string/u);
    });

    it('INVALID: {missing all fields} => throws validation error', () => {
      expect(() => testFailureContract.parse({})).toThrow(/received undefined/u);
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
