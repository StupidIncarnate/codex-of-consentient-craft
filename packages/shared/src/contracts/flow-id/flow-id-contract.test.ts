import { flowIdContract } from './flow-id-contract';
import { FlowIdStub } from './flow-id.stub';

describe('flowIdContract', () => {
  it('VALID: {value: kebab-case} => parses successfully', () => {
    const id = FlowIdStub({ value: 'login-flow' });

    expect(id).toBe('login-flow');
  });

  it('VALID: {default value} => uses default kebab-case', () => {
    const id = FlowIdStub();

    expect(id).toBe('login-flow');
  });

  it('VALID: {single word} => parses successfully', () => {
    const id = FlowIdStub({ value: 'login' });

    expect(id).toBe('login');
  });

  it('INVALID_ID: {value: "Not-Kebab"} => throws validation error', () => {
    expect(() => {
      return flowIdContract.parse('Not-Kebab');
    }).toThrow(/invalid_string/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return flowIdContract.parse('');
    }).toThrow(/too_small/u);
  });
});
