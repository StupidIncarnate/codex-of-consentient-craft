import { debugSessionParamsContract } from './debug-session-params-contract';
import { DebugSessionParamsStub } from './debug-session-params.stub';

describe('debugSessionParamsContract', () => {
  describe('valid input', () => {
    it('VALID: {onCommand, onResponse, installContext} => parses successfully', () => {
      const input = DebugSessionParamsStub();

      const result = debugSessionParamsContract.parse(input);

      expect(typeof result.onCommand).toBe('function');
      expect(typeof result.onResponse).toBe('function');
      expect(result.installContext).toStrictEqual({
        targetProjectRoot: '/test/project',
        dungeonmasterRoot: '/test/dungeonmaster',
      });
    });

    it('VALID: {without installContext} => parses with optional field omitted', () => {
      const result = debugSessionParamsContract.parse({
        onCommand: (): void => {
          // No-op
        },
        onResponse: (): void => {
          // No-op
        },
      });

      expect(typeof result.onCommand).toBe('function');
      expect(typeof result.onResponse).toBe('function');
      expect(result.installContext).toBeUndefined();
    });
  });
});
