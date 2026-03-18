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

  describe('framework line filtering', () => {
    it('VALID: {stack with framework lines} => filters framework lines and shows hidden count', () => {
      const stackTrace = [
        'Error: expected "wrong" received "ok"',
        '    at Object.<anonymous> (src/app.test.ts:14:58)',
        '    at Object.toBe (/home/user/project/node_modules/expect/build/index.js:2140:20)',
        '    at callAsyncCircusFn (/home/user/project/node_modules/jest-circus/build/jestAdapterInit.js:1497:10)',
        '    at runTest (/home/user/project/node_modules/jest-runner/build/index.js:343:7)',
      ].join('\n');

      const result = stackTraceTruncateTransformer({ stackTrace, maxLines: 5 });

      expect(result).toBe(
        TruncatedStackStub({
          value:
            'Error: expected "wrong" received "ok"\n    at Object.<anonymous> (src/app.test.ts:14:58)\n... (3 framework lines hidden, use --verbose for full trace)',
        }),
      );
    });

    it('VALID: {stack with mixed lines exceeding limit after filtering} => truncates filtered result', () => {
      const stackTrace = [
        'Error: fail',
        '    at a (src/a.ts:1:0)',
        '    at b (src/b.ts:2:0)',
        '    at c (src/c.ts:3:0)',
        '    at callAsyncCircusFn (/home/user/project/node_modules/jest-circus/build/jestAdapterInit.js:1:1)',
      ].join('\n');

      const result = stackTraceTruncateTransformer({ stackTrace, maxLines: 2 });

      expect(result).toBe(
        TruncatedStackStub({
          value:
            'Error: fail\n    at a (src/a.ts:1:0)\n... (3 more lines, use --verbose for full trace)',
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
