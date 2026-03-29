import { stepIdContract } from './step-id-contract';
import { StepIdStub } from './step-id.stub';

describe('stepIdContract', () => {
  it('VALID: {value: kebab-case} => parses successfully', () => {
    const id = StepIdStub({ value: 'create-login-api' });

    expect(id).toBe('create-login-api');
  });

  it('VALID: {default value} => uses default kebab-case', () => {
    const id = StepIdStub();

    expect(id).toBe('create-login-api');
  });

  it('VALID: {single word} => parses successfully', () => {
    const id = StepIdStub({ value: 'setup' });

    expect(id).toBe('setup');
  });

  it('INVALID: {value: "Not-Kebab"} => throws validation error', () => {
    expect(() => {
      return stepIdContract.parse('Not-Kebab');
    }).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return stepIdContract.parse('');
    }).toThrow(/too_small/u);
  });
});
