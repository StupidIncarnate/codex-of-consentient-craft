import { ExecutionQueueFlow } from './execution-queue-flow';

describe('ExecutionQueueFlow', () => {
  describe('bootstrap', () => {
    it('VALID: {first call} => returns success', () => {
      const result = ExecutionQueueFlow.bootstrap();

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {second call} => idempotent, returns success', () => {
      ExecutionQueueFlow.bootstrap();

      const result = ExecutionQueueFlow.bootstrap();

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('getAll', () => {
    it('VALID: exports a function returning an array', async () => {
      const entries = await ExecutionQueueFlow.getAll();

      expect(Array.isArray(entries)).toBe(true);
    });
  });
});
