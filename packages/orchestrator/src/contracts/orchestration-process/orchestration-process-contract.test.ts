import { orchestrationProcessContract } from './orchestration-process-contract';
import { OrchestrationProcessStub } from './orchestration-process.stub';

describe('orchestrationProcessContract', () => {
  describe('valid orchestration process', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const process = OrchestrationProcessStub();

      const result = orchestrationProcessContract.parse(process);

      expect(result).toStrictEqual({
        processId: 'proc-12345',
        questId: 'add-auth',
        kill: expect.any(Function),
      });
    });

    it('VALID: {with questWorkItemId} => parses successfully and preserves questWorkItemId', () => {
      const result = orchestrationProcessContract.parse({
        processId: 'proc-launcher-agent-1',
        questId: 'add-auth',
        questWorkItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        kill: () => undefined,
      });

      expect(result).toStrictEqual({
        processId: 'proc-launcher-agent-1',
        questId: 'add-auth',
        questWorkItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        kill: expect.any(Function),
      });
    });
  });

  describe('invalid orchestration process', () => {
    it('INVALID: {missing processId} => throws validation error', () => {
      expect(() => {
        orchestrationProcessContract.parse({
          questId: 'add-auth',
          kill: () => undefined,
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        orchestrationProcessContract.parse({
          processId: 'proc-123',
          kill: () => undefined,
        });
      }).toThrow(/Required/u);
    });
  });
});
