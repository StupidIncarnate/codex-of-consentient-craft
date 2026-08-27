import { orchestrationEventTypeContract } from './orchestration-event-type-contract';
import { OrchestrationEventTypeStub } from './orchestration-event-type.stub';

describe('orchestrationEventTypeContract', () => {
  it('VALID: {default} => uses default phase-change', () => {
    const type = OrchestrationEventTypeStub();

    expect(type).toBe('phase-change');
  });

  describe('enum membership', () => {
    it('VALID: {options} => exposes all 22 members in order, health-status last', () => {
      expect(orchestrationEventTypeContract.options).toStrictEqual([
        'phase-change',
        'slot-update',
        'progress-update',
        'process-complete',
        'process-failed',
        'chat-output',
        'chat-complete',
        'quest-created',
        'quest-modified',
        'quest-load-failed',
        'quest-persisted',
        'quest-paused',
        'quest-resumed',
        'clarification-request',
        'chat-history-complete',
        'quest-session-linked',
        'chat-session-started',
        'execution-queue-updated',
        'execution-queue-error',
        'rate-limits-updated',
        'dispatch-state-changed',
        'health-status',
      ]);
    });

    it.each(orchestrationEventTypeContract.options)(
      'VALID: {value: %s} => parses successfully',
      (type) => {
        expect(orchestrationEventTypeContract.parse(type)).toBe(type);
      },
    );
  });

  it('INVALID: {value: "invalid"} => throws validation error', () => {
    expect(() => {
      return orchestrationEventTypeContract.parse('invalid');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return orchestrationEventTypeContract.parse('');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: "smoketest-progress"} => throws validation error (removed enum value)', () => {
    expect(() => {
      return orchestrationEventTypeContract.parse('smoketest-progress');
    }).toThrow(/Invalid enum value/u);
  });
});
