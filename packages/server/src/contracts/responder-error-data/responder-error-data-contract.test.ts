import { responderErrorDataContract } from './responder-error-data-contract';
import { ResponderErrorDataStub } from './responder-error-data.stub';

describe('responderErrorDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = ResponderErrorDataStub();

    expect(responderErrorDataContract.parse(result)).toStrictEqual({ error: 'Invalid params' });
  });

  it('INVALID: {missing error} => throws validation error', () => {
    expect(() => responderErrorDataContract.parse({})).toThrow(/received undefined/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => responderErrorDataContract.parse({ error: 'Invalid params', extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
