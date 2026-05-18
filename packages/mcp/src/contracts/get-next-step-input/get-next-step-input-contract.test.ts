import { getNextStepInputContract } from './get-next-step-input-contract';
import { GetNextStepInputStub } from './get-next-step-input.stub';

describe('getNextStepInputContract', () => {
  it('VALID: {} => parses successfully', () => {
    const result = getNextStepInputContract.parse(GetNextStepInputStub());

    expect(result).toStrictEqual({});
  });

  it('INVALID: {extra key} => throws (strict)', () => {
    expect(() => getNextStepInputContract.parse({ unexpected: 'no' })).toThrow(/Unrecognized key/u);
  });
});
