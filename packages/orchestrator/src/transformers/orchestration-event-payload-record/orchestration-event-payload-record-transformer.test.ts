import { OrchestrationEventEnvelopeStub } from '../../contracts/orchestration-event-envelope/orchestration-event-envelope.stub';
import { orchestrationEventPayloadRecordTransformer } from './orchestration-event-payload-record-transformer';

describe('orchestrationEventPayloadRecordTransformer', (): void => {
  it('VALID: {default envelope stub} => returns payload with entries empty array', (): void => {
    const event = OrchestrationEventEnvelopeStub();

    const result = orchestrationEventPayloadRecordTransformer({ event });

    expect(result).toStrictEqual({ entries: [] });
  });

  it('VALID: {envelope without payload} => returns undefined', (): void => {
    const event = OrchestrationEventEnvelopeStub({ payload: undefined });

    const result = orchestrationEventPayloadRecordTransformer({ event });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {non-object event} => returns undefined', (): void => {
    const result = orchestrationEventPayloadRecordTransformer({ event: 'string' });

    expect(result).toBe(undefined);
  });
});
