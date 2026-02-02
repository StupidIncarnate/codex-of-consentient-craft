import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from './orchestration-processes-state';
import { orchestrationProcessesStateProxy } from './orchestration-processes-state.proxy';
import { OrchestrationProcessStub } from '../../contracts/orchestration-process/orchestration-process.stub';

describe('orchestrationProcessesState', () => {
  describe('register', () => {
    it('VALID: {orchestration process} => stores process in state', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const orchestrationProcess = OrchestrationProcessStub();

      orchestrationProcessesState.register({ orchestrationProcess });

      const result = orchestrationProcessesState.get({
        processId: orchestrationProcess.processId,
      });

      expect(result).toStrictEqual(orchestrationProcess);
    });
  });

  describe('get', () => {
    it('VALID: {existing processId} => returns process', () => {
      const proxy = orchestrationProcessesStateProxy();
      const orchestrationProcess = OrchestrationProcessStub();
      proxy.setupWithProcess({ orchestrationProcess });

      const result = orchestrationProcessesState.get({
        processId: orchestrationProcess.processId,
      });

      expect(result).toStrictEqual(orchestrationProcess);
    });

    it('EMPTY: {nonexistent processId} => returns undefined', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'nonexistent' });

      const result = orchestrationProcessesState.get({ processId });

      expect(result).toBeUndefined();
    });
  });

  describe('getStatus', () => {
    it('VALID: {existing process} => returns OrchestrationStatus', () => {
      const proxy = orchestrationProcessesStateProxy();
      const orchestrationProcess = OrchestrationProcessStub({
        processId: 'proc-test',
        questId: 'test-quest',
        phase: 'pathseeker',
        completedSteps: 2,
        totalSteps: 8,
      });
      proxy.setupWithProcess({ orchestrationProcess });

      const result = orchestrationProcessesState.getStatus({
        processId: orchestrationProcess.processId,
      });

      expect(result).toStrictEqual({
        processId: 'proc-test',
        questId: 'test-quest',
        phase: 'pathseeker',
        completed: 2,
        total: 8,
        currentStep: undefined,
        slots: [],
      });
    });

    it('EMPTY: {nonexistent processId} => returns undefined', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'nonexistent' });

      const result = orchestrationProcessesState.getStatus({ processId });

      expect(result).toBeUndefined();
    });
  });

  describe('updatePhase', () => {
    it('VALID: {existing process} => updates phase', () => {
      const proxy = orchestrationProcessesStateProxy();
      const orchestrationProcess = OrchestrationProcessStub({ phase: 'idle' });
      proxy.setupWithProcess({ orchestrationProcess });

      orchestrationProcessesState.updatePhase({
        processId: orchestrationProcess.processId,
        phase: 'codeweaver',
      });

      const result = orchestrationProcessesState.get({
        processId: orchestrationProcess.processId,
      });

      expect(result?.phase).toBe('codeweaver');
    });
  });

  describe('remove', () => {
    it('VALID: {existing process} => removes and returns true', () => {
      const proxy = orchestrationProcessesStateProxy();
      const orchestrationProcess = OrchestrationProcessStub();
      proxy.setupWithProcess({ orchestrationProcess });

      const removed = orchestrationProcessesState.remove({
        processId: orchestrationProcess.processId,
      });

      expect(removed).toBe(true);
      expect(
        orchestrationProcessesState.get({ processId: orchestrationProcess.processId }),
      ).toBeUndefined();
    });

    it('EMPTY: {nonexistent processId} => returns false', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'nonexistent' });

      const removed = orchestrationProcessesState.remove({ processId });

      expect(removed).toBe(false);
    });
  });

  describe('getAll', () => {
    it('VALID: {multiple processes} => returns all processIds', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();
      const process1 = OrchestrationProcessStub({ processId: 'proc-1' });
      const process2 = OrchestrationProcessStub({ processId: 'proc-2' });
      orchestrationProcessesState.register({ orchestrationProcess: process1 });
      orchestrationProcessesState.register({ orchestrationProcess: process2 });

      const result = orchestrationProcessesState.getAll();

      expect(result).toStrictEqual(['proc-1', 'proc-2']);
    });

    it('EMPTY: {no processes} => returns empty array', () => {
      const proxy = orchestrationProcessesStateProxy();
      proxy.setupEmpty();

      const result = orchestrationProcessesState.getAll();

      expect(result).toStrictEqual([]);
    });
  });
});
