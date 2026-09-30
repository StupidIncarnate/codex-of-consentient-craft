import { toolingSmoketestStateResponseDataContract } from './tooling-smoketest-state-response-data-contract';
import { ToolingSmoketestStateResponseDataStub } from './tooling-smoketest-state-response-data.stub';

describe('toolingSmoketestStateResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = ToolingSmoketestStateResponseDataStub();

    expect(toolingSmoketestStateResponseDataContract.parse(result)).toStrictEqual({
      active: null,
      events: [],
    });
  });

  it('INVALID: {missing events} => throws validation error', () => {
    expect(() => toolingSmoketestStateResponseDataContract.parse({ active: null })).toThrow(
      /received undefined/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      toolingSmoketestStateResponseDataContract.parse({ active: null, events: [], extra: 1 }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });
});
