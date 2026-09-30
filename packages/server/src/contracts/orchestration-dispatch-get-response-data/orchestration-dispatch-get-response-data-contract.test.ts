import { orchestrationDispatchGetResponseDataContract } from './orchestration-dispatch-get-response-data-contract';
import { OrchestrationDispatchGetResponseDataStub } from './orchestration-dispatch-get-response-data.stub';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

describe('orchestrationDispatchGetResponseDataContract', () => {
  it('VALID: {default stub} => parses to the dispatch state', () => {
    const result = OrchestrationDispatchGetResponseDataStub();

    expect(orchestrationDispatchGetResponseDataContract.parse(result)).toStrictEqual({
      state: DispatchStateStub(),
    });
  });

  it('INVALID: {state: mode bogus} => throws validation error', () => {
    expect(() =>
      orchestrationDispatchGetResponseDataContract.parse({
        state: { mode: 'bogus', updatedAt: '2024-01-15T10:00:00.000Z' },
      }),
    ).toThrow(/Invalid option/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      orchestrationDispatchGetResponseDataContract.parse({ state: DispatchStateStub(), extra: 1 }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });
});
