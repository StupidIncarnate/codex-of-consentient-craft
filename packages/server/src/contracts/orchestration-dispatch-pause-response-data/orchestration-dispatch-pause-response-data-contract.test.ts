import { orchestrationDispatchPauseResponseDataContract } from './orchestration-dispatch-pause-response-data-contract';
import { OrchestrationDispatchPauseResponseDataStub } from './orchestration-dispatch-pause-response-data.stub';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

describe('orchestrationDispatchPauseResponseDataContract', () => {
  it('VALID: {default stub} => parses to the dispatch state', () => {
    const result = OrchestrationDispatchPauseResponseDataStub();

    expect(orchestrationDispatchPauseResponseDataContract.parse(result)).toStrictEqual({
      state: DispatchStateStub(),
    });
  });

  it('INVALID: {state: mode bogus} => throws validation error', () => {
    expect(() =>
      orchestrationDispatchPauseResponseDataContract.parse({
        state: { mode: 'bogus', updatedAt: '2024-01-15T10:00:00.000Z' },
      }),
    ).toThrow(/Invalid option/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      orchestrationDispatchPauseResponseDataContract.parse({
        state: DispatchStateStub(),
        extra: 1,
      }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });
});
