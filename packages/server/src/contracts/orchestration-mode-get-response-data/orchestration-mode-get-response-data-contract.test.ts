import { orchestrationModeGetResponseDataContract } from './orchestration-mode-get-response-data-contract';
import { OrchestrationModeGetResponseDataStub } from './orchestration-mode-get-response-data.stub';

describe('orchestrationModeGetResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = OrchestrationModeGetResponseDataStub();

    expect(orchestrationModeGetResponseDataContract.parse(result)).toStrictEqual({ mode: 'node' });
  });

  it('INVALID: {mode: bogus} => throws validation error', () => {
    expect(() => orchestrationModeGetResponseDataContract.parse({ mode: 'bogus' })).toThrow(
      /Invalid option/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      orchestrationModeGetResponseDataContract.parse({ mode: 'node', extra: 1 }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });
});
