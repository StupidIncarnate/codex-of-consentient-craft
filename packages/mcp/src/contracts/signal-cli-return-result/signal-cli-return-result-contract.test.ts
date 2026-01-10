import { signalCliReturnResultContract } from './signal-cli-return-result-contract';
import { SignalCliReturnResultStub } from './signal-cli-return-result.stub';

describe('signalCliReturnResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true, signalPath} => parses successfully', () => {
      const result = SignalCliReturnResultStub({
        success: true,
        signalPath: '/project/.dungeonmaster-quests/.cli-signal',
      });

      const parsed = signalCliReturnResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: true,
        signalPath: '/project/.dungeonmaster-quests/.cli-signal',
      });
    });

    it('VALID: {success: false, signalPath} => parses with false success', () => {
      const result = SignalCliReturnResultStub({ success: false });

      const parsed = signalCliReturnResultContract.parse(result);

      expect(parsed.success).toBe(false);
    });
  });

  describe('invalid results', () => {
    it('INVALID_SUCCESS: {success: "true"} => throws validation error', () => {
      expect(() => {
        signalCliReturnResultContract.parse({
          success: 'true',
          signalPath: '/path/.cli-signal',
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        signalCliReturnResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
