import { orchestrationEventEnvelopeContract } from './orchestration-event-envelope-contract';
import { OrchestrationEventEnvelopeStub } from './orchestration-event-envelope.stub';

describe('orchestrationEventEnvelopeContract', (): void => {
  it('VALID: {default stub} => parses with chat-output shape', (): void => {
    const env = OrchestrationEventEnvelopeStub();

    expect(env).toStrictEqual({
      type: 'chat-output',
      processId: 'proc-stub',
      payload: { entries: [] },
    });
  });

  it('VALID: {custom payload keys} => preserved on payload record', (): void => {
    const env = orchestrationEventEnvelopeContract.parse({
      type: 'phase-change',
      processId: 'proc-1',
      payload: { phase: 'codeweaver', extra: 5 },
    });

    expect(env.payload).toStrictEqual({ phase: 'codeweaver', extra: 5 });
  });

  it('VALID: {empty object} => parses with all optional', (): void => {
    const env = orchestrationEventEnvelopeContract.parse({});

    expect(env.type).toBe(undefined);
  });

  it('VALID: {extra envelope keys} => preserved via passthrough', (): void => {
    const env = orchestrationEventEnvelopeContract.parse({ ts: 12345 });

    expect((env as { ts?: unknown }).ts).toBe(12345);
  });

  it('ERROR: {non-object} => throws', (): void => {
    expect((): unknown => orchestrationEventEnvelopeContract.parse('foo')).toThrow(
      /Expected object/u,
    );
  });
});
