import { OrchestrationEventTypeStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { orchestrationEventsState } from './orchestration-events-state';
import { orchestrationEventsStateProxy } from './orchestration-events-state.proxy';

describe('orchestrationEventsState', () => {
  describe('emit and on', () => {
    it('VALID: {registered handler} => handler receives event', () => {
      const proxy = orchestrationEventsStateProxy();
      proxy.setupEmpty();
      const type = OrchestrationEventTypeStub({ value: 'phase-change' });
      const processId = ProcessIdStub({ value: 'proc-123' });
      const handler = jest.fn();

      orchestrationEventsState.on({ type, handler });
      orchestrationEventsState.emit({ type, processId, payload: { phase: 'codeweaver' } });

      expect(handler).toHaveBeenCalledWith({ processId, payload: { phase: 'codeweaver' } });
    });

    it('VALID: {multiple handlers} => all handlers receive event', () => {
      const proxy = orchestrationEventsStateProxy();
      proxy.setupEmpty();
      const type = OrchestrationEventTypeStub({ value: 'progress-update' });
      const processId = ProcessIdStub({ value: 'proc-456' });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      orchestrationEventsState.on({ type, handler: handler1 });
      orchestrationEventsState.on({ type, handler: handler2 });
      orchestrationEventsState.emit({ type, processId, payload: { completedSteps: 3 } });

      expect(handler1).toHaveBeenCalledWith({ processId, payload: { completedSteps: 3 } });
      expect(handler2).toHaveBeenCalledWith({ processId, payload: { completedSteps: 3 } });
    });

    it('EMPTY: {no handlers for type} => no error thrown', () => {
      const proxy = orchestrationEventsStateProxy();
      proxy.setupEmpty();
      const type = OrchestrationEventTypeStub({ value: 'slot-update' });
      const processId = ProcessIdStub({ value: 'proc-789' });

      expect(() => {
        orchestrationEventsState.emit({ type, processId, payload: {} });
      }).not.toThrow();
    });

    it('VALID: {different event types} => only matching handler fires', () => {
      const proxy = orchestrationEventsStateProxy();
      proxy.setupEmpty();
      const phaseType = OrchestrationEventTypeStub({ value: 'phase-change' });
      const progressType = OrchestrationEventTypeStub({ value: 'progress-update' });
      const processId = ProcessIdStub({ value: 'proc-abc' });
      const phaseHandler = jest.fn();
      const progressHandler = jest.fn();

      orchestrationEventsState.on({ type: phaseType, handler: phaseHandler });
      orchestrationEventsState.on({ type: progressType, handler: progressHandler });
      orchestrationEventsState.emit({ type: phaseType, processId, payload: { phase: 'ward' } });

      expect(phaseHandler).toHaveBeenCalledTimes(1);
      expect(progressHandler).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('VALID: {removed handler} => handler no longer fires', () => {
      const proxy = orchestrationEventsStateProxy();
      proxy.setupEmpty();
      const type = OrchestrationEventTypeStub({ value: 'phase-change' });
      const processId = ProcessIdStub({ value: 'proc-off' });
      const handler = jest.fn();

      orchestrationEventsState.on({ type, handler });
      orchestrationEventsState.off({ type, handler });
      orchestrationEventsState.emit({ type, processId, payload: {} });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('removeAllListeners', () => {
    it('VALID: {listeners registered} => all listeners cleared', () => {
      const proxy = orchestrationEventsStateProxy();
      proxy.setupEmpty();
      const type1 = OrchestrationEventTypeStub({ value: 'phase-change' });
      const type2 = OrchestrationEventTypeStub({ value: 'slot-update' });
      const processId = ProcessIdStub({ value: 'proc-clear' });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      orchestrationEventsState.on({ type: type1, handler: handler1 });
      orchestrationEventsState.on({ type: type2, handler: handler2 });
      orchestrationEventsState.removeAllListeners();
      orchestrationEventsState.emit({ type: type1, processId, payload: {} });
      orchestrationEventsState.emit({ type: type2, processId, payload: {} });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });
});
