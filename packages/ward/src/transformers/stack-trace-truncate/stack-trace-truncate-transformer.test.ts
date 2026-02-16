import { TruncatedStackStub } from '../../contracts/truncated-stack/truncated-stack.stub';
import { stackTraceTruncateTransformer } from './stack-trace-truncate-transformer';

describe('stackTraceTruncateTransformer', () => {
  describe('short stack traces', () => {
    it('VALID: {stackTrace 2 lines, maxLines 3} => returns full stack unchanged', () => {
      const stackTrace = 'Error: fail\n    at Object.<anonymous> (src/index.ts:10:5)';

      const result = stackTraceTruncateTransformer({ stackTrace, maxLines: 3 });

      expect(result).toBe(TruncatedStackStub({ value: stackTrace }));
    });

    it('VALID: {stackTrace 3 lines, maxLines 3} => returns full stack at exact limit', () => {
      const stackTrace = 'Error: fail\n    at a (file.ts:1:0)\n    at b (file.ts:2:0)';

      const result = stackTraceTruncateTransformer({ stackTrace, maxLines: 3 });

      expect(result).toBe(TruncatedStackStub({ value: stackTrace }));
    });
  });

  describe('long stack traces', () => {
    it('VALID: {stackTrace 5 lines, maxLines 2} => truncates to 2 lines with remaining count', () => {
      const stackTrace =
        'Error: fail\n    at a (file.ts:1:0)\n    at b (file.ts:2:0)\n    at c (file.ts:3:0)\n    at d (file.ts:4:0)';

      const result = stackTraceTruncateTransformer({ stackTrace, maxLines: 2 });

      expect(result).toBe(
        TruncatedStackStub({
          value:
            'Error: fail\n    at a (file.ts:1:0)\n... (3 more lines, use --verbose for full trace)',
        }),
      );
    });

    it('VALID: {stackTrace 4 lines, maxLines 3} => truncates to 3 lines with 1 remaining', () => {
      const stackTrace =
        'Error: fail\n    at a (file.ts:1:0)\n    at b (file.ts:2:0)\n    at c (file.ts:3:0)';

      const result = stackTraceTruncateTransformer({ stackTrace, maxLines: 3 });

      expect(result).toBe(
        TruncatedStackStub({
          value:
            'Error: fail\n    at a (file.ts:1:0)\n    at b (file.ts:2:0)\n... (1 more lines, use --verbose for full trace)',
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {single line stack trace, maxLines 1} => returns unchanged', () => {
      const stackTrace = 'Error: fail';

      const result = stackTraceTruncateTransformer({ stackTrace, maxLines: 1 });

      expect(result).toBe(TruncatedStackStub({ value: stackTrace }));
    });

    it('EDGE: {empty string, maxLines 1} => returns empty string unchanged', () => {
      const result = stackTraceTruncateTransformer({ stackTrace: '', maxLines: 1 });

      expect(result).toBe(TruncatedStackStub({ value: '' }));
    });
  });
});
