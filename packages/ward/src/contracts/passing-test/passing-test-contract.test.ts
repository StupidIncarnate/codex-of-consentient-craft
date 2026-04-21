import { passingTestContract } from './passing-test-contract';
import { PassingTestStub } from './passing-test.stub';

describe('passingTestContract', () => {
  describe('valid inputs', () => {
    it('VALID: {full passing test with duration} => parses successfully', () => {
      const result = passingTestContract.parse(
        PassingTestStub({
          suitePath: 'src/foo.test.ts',
          testName: 'VALID: {input} => result',
          durationMs: 42,
        }),
      );

      expect(result).toStrictEqual({
        suitePath: 'src/foo.test.ts',
        testName: 'VALID: {input} => result',
        durationMs: 42,
      });
    });

    it('VALID: {without durationMs} => applies default 0', () => {
      const result = passingTestContract.parse({
        suitePath: 'src/app.test.ts',
        testName: 'VALID: {x} => y',
      });

      expect(result).toStrictEqual({
        suitePath: 'src/app.test.ts',
        testName: 'VALID: {x} => y',
        durationMs: 0,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {suitePath: number} => throws validation error', () => {
      expect(() =>
        passingTestContract.parse({
          suitePath: 123 as never,
          testName: 'test',
          durationMs: 0,
        }),
      ).toThrow(/Expected string/u);
    });

    it('INVALID: {missing suitePath and testName} => throws validation error', () => {
      expect(() => passingTestContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid passing test', () => {
      const result = PassingTestStub();

      expect(result).toStrictEqual({
        suitePath: 'src/index.test.ts',
        testName: 'should return valid result',
        durationMs: 0,
      });
    });

    it('VALID: {custom values} => creates passing test with overrides', () => {
      const result = PassingTestStub({
        suitePath: 'src/other.test.ts',
        testName: 'custom test',
        durationMs: 123,
      });

      expect(result).toStrictEqual({
        suitePath: 'src/other.test.ts',
        testName: 'custom test',
        durationMs: 123,
      });
    });
  });
});
