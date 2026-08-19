import { orchestrationEventTypeContract } from './orchestration-event-type-contract';
import { OrchestrationEventTypeStub } from './orchestration-event-type.stub';

describe('orchestrationEventTypeContract', () => {
  it('VALID: {default} => uses default phase-change', () => {
    const type = OrchestrationEventTypeStub();

    expect(type).toBe('phase-change');
  });

  it.each(orchestrationEventTypeContract.options)(
    'VALID: {value: %s} => parses successfully',
    (type) => {
      expect(orchestrationEventTypeContract.parse(type)).toBe(type);
    },
  );

  it('VALID: {value: "health-updated"} => parses the new health tick event type', () => {
    expect(orchestrationEventTypeContract.parse('health-updated')).toBe('health-updated');
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
