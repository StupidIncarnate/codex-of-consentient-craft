import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { capturedOrchestrationEmitContract } from './captured-orchestration-emit-contract';
import { CapturedOrchestrationEmitStub } from './captured-orchestration-emit.stub';

describe('capturedOrchestrationEmitContract', () => {
  it('VALID: {default stub} => parses through', () => {
    const stub = CapturedOrchestrationEmitStub();

    expect(stub).toStrictEqual({
      processId: ProcessIdStub({ value: 'proc-aaaaaaaa-1111-4222-9333-444444444444' }),
      payload: {},
    });
  });

  it('VALID: {processId + payload with one field} => parses through preserving the field', () => {
    const processId = ProcessIdStub({ value: 'proc-bbbbbbbb-1111-4222-9333-444444444444' });

    const parsed = capturedOrchestrationEmitContract.parse({
      processId,
      payload: { questId: 'q-1' },
    });

    expect(parsed).toStrictEqual({ processId, payload: { questId: 'q-1' } });
  });

  it('INVALID: {payload missing} => throws validation error', () => {
    const processId = ProcessIdStub({ value: 'proc-cccccccc-1111-4222-9333-444444444444' });

    expect(() => {
      return capturedOrchestrationEmitContract.parse({ processId });
    }).toThrow(/Required/u);
  });

  it('INVALID: {processId missing} => throws validation error', () => {
    expect(() => {
      return capturedOrchestrationEmitContract.parse({ payload: {} });
    }).toThrow(/Required/u);
  });
});
