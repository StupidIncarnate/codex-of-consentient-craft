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
