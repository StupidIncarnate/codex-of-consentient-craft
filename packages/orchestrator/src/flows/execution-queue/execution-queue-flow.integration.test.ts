import { ExecutionQueueFlow } from './execution-queue-flow';

describe('ExecutionQueueFlow', () => {
  describe('bootstrap', () => {
    // ExecutionQueueFlow.bootstrap() returns void (a synchronous void expression cannot be
    // captured into a variable or passed to expect() — @typescript-eslint/no-confusing-void-expression
    // refuses both), and flows/ cannot import state/ to observe the listener it wires directly. The
    // deep real-effect proof (the listener broadcasts execution-queue-updated on a queue change)
    // lives in ExecutionQueueBootstrapResponder's own unit test. This flow-level test proves the
    // call is reached at all and leaves the flow's other surface working, the same way
    // start-orchestrator.integration.test.ts proves stopAllChats via its sibling stopChat.
    it('VALID: {first call} => wires the passive listeners; getAll still resolves', async () => {
      ExecutionQueueFlow.bootstrap();

      const entries = await ExecutionQueueFlow.getAll();

      expect(entries).toStrictEqual([]);
    });

    it('VALID: {second call} => idempotent; getAll still resolves', async () => {
      ExecutionQueueFlow.bootstrap();
      ExecutionQueueFlow.bootstrap();

      const entries = await ExecutionQueueFlow.getAll();

      expect(entries).toStrictEqual([]);
    });
  });

  describe('getAll', () => {
    it('VALID: exports a function returning an array', async () => {
      const entries = await ExecutionQueueFlow.getAll();

      expect(Array.isArray(entries)).toBe(true);
    });
  });
});
