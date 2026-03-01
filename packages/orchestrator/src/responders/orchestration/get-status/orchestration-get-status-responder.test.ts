import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationProcessStub } from '../../../contracts/orchestration-process/orchestration-process.stub';
import { OrchestrationGetStatusResponderProxy } from './orchestration-get-status-responder.proxy';

describe('OrchestrationGetStatusResponder', () => {
  describe('process found', () => {
    it('VALID: {processId} => returns orchestration status for registered process', () => {
      const processId = ProcessIdStub({ value: 'proc-test-123' });
      const orchestrationProcess = OrchestrationProcessStub({
        processId,
        questId: 'add-auth',
        phase: 'codeweaver',
        completedSteps: 2,
        totalSteps: 5,
      });
      const proxy = OrchestrationGetStatusResponderProxy();
      proxy.setupWithProcess({ orchestrationProcess });

      const result = proxy.callResponder({ processId });

      expect(result).toStrictEqual({
        processId: 'proc-test-123',
        questId: 'add-auth',
        phase: 'codeweaver',
        completed: 2,
        total: 5,
        currentStep: undefined,
        slots: [],
      });
    });
  });

  describe('process not found', () => {
    it('ERROR: {unknown processId} => throws process not found error', () => {
      const processId = ProcessIdStub({ value: 'proc-nonexistent' });
      const proxy = OrchestrationGetStatusResponderProxy();
      proxy.setupEmpty();

      expect(() => proxy.callResponder({ processId })).toThrow(
        /Process not found: proc-nonexistent/u,
      );
    });
  });
});
