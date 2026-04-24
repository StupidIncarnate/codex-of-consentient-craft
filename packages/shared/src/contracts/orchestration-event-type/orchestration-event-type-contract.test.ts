import { orchestrationEventTypeContract } from './orchestration-event-type-contract';
import { OrchestrationEventTypeStub } from './orchestration-event-type.stub';

describe('orchestrationEventTypeContract', () => {
  it('VALID: {default} => uses default phase-change', () => {
    const type = OrchestrationEventTypeStub();

    expect(type).toBe('phase-change');
  });

  it.each([
    'phase-change',
    'slot-update',
    'progress-update',
    'process-complete',
    'process-failed',
    'chat-output',
    'chat-complete',
    'quest-created',
    'quest-modified',
    'quest-persisted',
    'clarification-request',
    'chat-patch',
    'chat-history-complete',
    'quest-session-linked',
    'chat-session-started',
    'smoketest-progress',
    'execution-queue-updated',
    'execution-queue-error',
  ] as const)('VALID: {value: %s} => parses successfully', (type) => {
    expect(orchestrationEventTypeContract.parse(type)).toBe(type);
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
});
