import { observableIdContract } from './observable-id-contract';
import { ObservableIdStub } from './observable-id.stub';

describe('observableIdContract', () => {
  it('VALID: {value: kebab-case} => parses successfully', () => {
    const id = ObservableIdStub({ value: 'login-redirects-to-dashboard' });

    expect(id).toBe('login-redirects-to-dashboard');
  });

  it('VALID: {default value} => uses default kebab-case', () => {
    const id = ObservableIdStub();

    expect(id).toBe('login-redirects-to-dashboard');
  });

  it('VALID: {single word} => parses successfully', () => {
    const id = ObservableIdStub({ value: 'redirect' });

    expect(id).toBe('redirect');
  });

  it('INVALID_ID: {value: "Not-Kebab"} => throws validation error', () => {
    expect(() => {
      return observableIdContract.parse('Not-Kebab');
    }).toThrow(/invalid_string/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return observableIdContract.parse('');
    }).toThrow(/too_small/u);
  });
});
