import { stepOutputNameContract } from './step-output-name-contract';
import { StepOutputNameStub } from './step-output-name.stub';

describe('stepOutputNameContract', () => {
  it('VALID: {value: "g"} => returns "g"', () => {
    expect(StepOutputNameStub({ value: 'g' })).toBe('g');
  });

  it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
    expect(() => stepOutputNameContract.parse('')).toThrow(
      /String must contain at least 1 character\(s\)/u,
    );
  });
});
