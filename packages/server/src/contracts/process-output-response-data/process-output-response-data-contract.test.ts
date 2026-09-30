import { processOutputResponseDataContract } from './process-output-response-data-contract';
import { ProcessOutputResponseDataStub } from './process-output-response-data.stub';

describe('processOutputResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = ProcessOutputResponseDataStub();

    expect(processOutputResponseDataContract.parse(result)).toStrictEqual({ slots: {} });
  });

  it('INVALID: {missing slots} => throws validation error', () => {
    expect(() => processOutputResponseDataContract.parse({})).toThrow(/received undefined/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => processOutputResponseDataContract.parse({ slots: { extra: 1 } })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
