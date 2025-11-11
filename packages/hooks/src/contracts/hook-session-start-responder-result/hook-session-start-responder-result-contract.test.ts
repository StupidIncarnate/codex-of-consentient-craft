import { hookSessionStartResponderResultContract } from './hook-session-start-responder-result-contract';
import { HookSessionStartResponderResultStub } from './hook-session-start-responder-result.stub';

describe('hookSessionStartResponderResultContract', () => {
  describe('valid input', () => {
    it('VALID: {shouldOutput: false} => parses successfully', () => {
      const result = HookSessionStartResponderResultStub({ shouldOutput: false });

      expect(result).toStrictEqual({
        shouldOutput: false,
      });
    });

    it('VALID: {shouldOutput: true, content: "output"} => parses successfully', () => {
      const result = HookSessionStartResponderResultStub({
        shouldOutput: true,
        content: hookSessionStartResponderResultContract.shape.content
          .unwrap()
          .parse('Session started'),
      });

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: 'Session started',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID_SHOULDOUTPUT: {shouldOutput: not a boolean} => throws validation error', () => {
      expect(() => {
        return hookSessionStartResponderResultContract.parse({
          shouldOutput: 'not a boolean' as never,
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_CONTENT: {content: not a string} => throws validation error', () => {
      expect(() => {
        return hookSessionStartResponderResultContract.parse({
          shouldOutput: false,
          content: 123 as never,
        });
      }).toThrow(/Expected string/u);
    });
  });
});
