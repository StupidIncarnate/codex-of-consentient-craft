import { buildDebugResponseParamsContract } from './build-debug-response-params-contract';
import { BuildDebugResponseParamsStub } from './build-debug-response-params.stub';

describe('buildDebugResponseParamsContract', () => {
  describe('valid input', () => {
    it('VALID: {success: true, frame, currentScreen, invocations} => parses successfully', () => {
      const input = BuildDebugResponseParamsStub();

      const result = buildDebugResponseParamsContract.parse(input);

      expect(result.success).toBe(true);
      expect(result.currentScreen).toBe('menu');
    });

    it('VALID: {success: false, error, frame, currentScreen, invocations} => parses with error', () => {
      const input = BuildDebugResponseParamsStub({
        success: false,
        error: 'Test error',
      });

      const result = buildDebugResponseParamsContract.parse(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });
});
