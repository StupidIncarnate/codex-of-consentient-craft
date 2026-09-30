import { orchestrationDispatchPlayResponseDataContract } from './orchestration-dispatch-play-response-data-contract';
import { OrchestrationDispatchPlayResponseDataStub } from './orchestration-dispatch-play-response-data.stub';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

describe('orchestrationDispatchPlayResponseDataContract', () => {
  it('VALID: {default stub} => parses to the dispatch state', () => {
    const result = OrchestrationDispatchPlayResponseDataStub();

    expect(orchestrationDispatchPlayResponseDataContract.parse(result)).toStrictEqual({
      state: DispatchStateStub(),
    });
  });

  it('INVALID: {state: mode bogus} => throws validation error', () => {
    expect(() =>
      orchestrationDispatchPlayResponseDataContract.parse({
        state: { mode: 'bogus', updatedAt: '2024-01-15T10:00:00.000Z' },
      }),
    ).toThrow(/Invalid option/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      orchestrationDispatchPlayResponseDataContract.parse({ state: DispatchStateStub(), extra: 1 }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });
});
