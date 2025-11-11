import { hookPreEditResponderResultContract } from './hook-pre-edit-responder-result-contract';
import { HookPreEditResponderResultStub } from './hook-pre-edit-responder-result.stub';

describe('hookPreEditResponderResultContract', () => {
  describe('valid input', () => {
    it('VALID: {shouldBlock: false} => parses successfully', () => {
      const result = HookPreEditResponderResultStub({ shouldBlock: false });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });

    it('VALID: {shouldBlock: true, message: "blocked"} => parses successfully', () => {
      const result = HookPreEditResponderResultStub({
        shouldBlock: true,
        message: hookPreEditResponderResultContract.shape.message.unwrap().parse('Blocked by hook'),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: 'Blocked by hook',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID_SHOULDBLOCK: {shouldBlock: not a boolean} => throws validation error', () => {
      expect(() => {
        return hookPreEditResponderResultContract.parse({
          shouldBlock: 'not a boolean' as never,
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_MESSAGE: {message: not a string} => throws validation error', () => {
      expect(() => {
        return hookPreEditResponderResultContract.parse({
          shouldBlock: false,
          message: 123 as never,
        });
      }).toThrow(/Expected string/u);
    });
  });
});
