import { mockProcessBehaviorContract } from './mock-process-behavior-contract';
import { MockProcessBehaviorStub } from './mock-process-behavior.stub';
import { MockSpawnResultStub } from '../mock-spawn-result/mock-spawn-result.stub';

describe('mockProcessBehaviorContract', () => {
  describe('valid inputs', () => {
    it('VALID: {result: {code: 0, stdout: "", stderr: ""}} => parses with result only', () => {
      const behavior = MockProcessBehaviorStub({
        result: MockSpawnResultStub({ code: 0, stdout: '', stderr: '' }),
      });

      const parsed = mockProcessBehaviorContract.parse(behavior);

      expect(parsed).toStrictEqual({
        result: { code: 0, stdout: '', stderr: '' },
      });
    });

    it('VALID: {shouldThrow: true, throwError: Error} => parses throw configuration', () => {
      const error = new Error('spawn ENOENT');
      const behavior = MockProcessBehaviorStub({
        shouldThrow: true,
        throwError: error,
      });

      const parsed = mockProcessBehaviorContract.parse(behavior);

      expect(parsed).toStrictEqual({
        shouldThrow: true,
        throwError: error,
        result: { code: 0, stdout: '', stderr: '' },
      });
    });

    it('VALID: {delay: 1000} => parses with delay', () => {
      const behavior = MockProcessBehaviorStub({
        delay: 1000,
      });

      const parsed = mockProcessBehaviorContract.parse(behavior);

      expect(parsed).toStrictEqual({
        delay: 1000,
        result: { code: 0, stdout: '', stderr: '' },
      });
    });

    it('VALID: {all fields} => parses complete configuration', () => {
      const error = new Error('Test error');
      const behavior = MockProcessBehaviorStub({
        shouldThrow: false,
        throwError: error,
        result: MockSpawnResultStub({ code: 1, stdout: 'out', stderr: 'err' }),
        delay: 500,
      });

      const parsed = mockProcessBehaviorContract.parse(behavior);

      expect(parsed).toStrictEqual({
        shouldThrow: false,
        throwError: error,
        result: { code: 1, stdout: 'out', stderr: 'err' },
        delay: 500,
      });
    });

    it('EDGE: {delay: 0} => parses zero delay', () => {
      const behavior = MockProcessBehaviorStub({
        delay: 0,
      });

      const parsed = mockProcessBehaviorContract.parse(behavior);

      expect(parsed).toStrictEqual({
        delay: 0,
        result: { code: 0, stdout: '', stderr: '' },
      });
    });

    it('EDGE: {shouldThrow: false} => parses explicit false', () => {
      const behavior = MockProcessBehaviorStub({
        shouldThrow: false,
      });

      const parsed = mockProcessBehaviorContract.parse(behavior);

      expect(parsed).toStrictEqual({
        shouldThrow: false,
        result: { code: 0, stdout: '', stderr: '' },
      });
    });

    it('VALID: {empty with defaults from stub} => parses with default result', () => {
      const behavior = MockProcessBehaviorStub();

      const parsed = mockProcessBehaviorContract.parse(behavior);

      expect(parsed).toStrictEqual({
        result: { code: 0, stdout: '', stderr: '' },
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SHOULD_THROW: {shouldThrow: "true"} => throws validation error for string', () => {
      expect(() => {
        return mockProcessBehaviorContract.parse({
          shouldThrow: 'true' as never,
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_THROW_ERROR: {throwError: "error"} => throws validation error for non-Error', () => {
      expect(() => {
        return mockProcessBehaviorContract.parse({
          throwError: 'error' as never,
        });
      }).toThrow(/Input not instance of Error/u);
    });

    it('INVALID_RESULT: {result: {code: "0"}} => throws validation error for invalid result', () => {
      expect(() => {
        return mockProcessBehaviorContract.parse({
          result: { code: '0', stdout: '', stderr: '' } as never,
        });
      }).toThrow(/Expected number/u);
    });

    it('INVALID_DELAY: {delay: -1} => throws validation error for negative delay', () => {
      expect(() => {
        return mockProcessBehaviorContract.parse({
          delay: -1,
        });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID_DELAY: {delay: 1.5} => throws validation error for non-integer delay', () => {
      expect(() => {
        return mockProcessBehaviorContract.parse({
          delay: 1.5,
        });
      }).toThrow(/Expected integer/u);
    });

    it('INVALID_DELAY: {delay: "1000"} => throws validation error for string delay', () => {
      expect(() => {
        return mockProcessBehaviorContract.parse({
          delay: '1000' as never,
        });
      }).toThrow(/Expected number/u);
    });

    it('INVALID_MULTIPLE: {shouldThrow: 1, delay: "fast"} => throws validation error for multiple invalid fields', () => {
      expect(() => {
        return mockProcessBehaviorContract.parse({
          shouldThrow: 1 as never,
          delay: 'fast' as never,
        });
      }).toThrow(/Expected boolean/u);
    });
  });
});
