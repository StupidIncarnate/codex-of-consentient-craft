import { FunctionNameStub } from './function-name.stub';

describe('functionNameContract', () => {
  it('VALID: {value: "userFetchBroker"} => parses successfully', () => {
    const result = FunctionNameStub({ value: 'userFetchBroker' });

    expect(result).toBe('userFetchBroker');
  });

  it('VALID: {value: "has-permission-guard"} => parses successfully', () => {
    const result = FunctionNameStub({ value: 'has-permission-guard' });

    expect(result).toBe('has-permission-guard');
  });

  it('VALID: {value: single word} => parses successfully', () => {
    const result = FunctionNameStub({ value: 'fetch' });

    expect(result).toBe('fetch');
  });

  it('VALID: {value: camelCase} => parses successfully', () => {
    const result = FunctionNameStub({ value: 'getUserById' });

    expect(result).toBe('getUserById');
  });

  it('VALID: {value: PascalCase} => parses successfully', () => {
    const result = FunctionNameStub({ value: 'UserProfile' });

    expect(result).toBe('UserProfile');
  });

  it('VALID: {value: snake_case} => parses successfully', () => {
    const result = FunctionNameStub({ value: 'user_fetch_broker' });

    expect(result).toBe('user_fetch_broker');
  });

  it('VALID: {value: with numbers} => parses successfully', () => {
    const result = FunctionNameStub({ value: 'fetchUser2Data' });

    expect(result).toBe('fetchUser2Data');
  });

  it('VALID: {value: empty string} => parses successfully', () => {
    const result = FunctionNameStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: with underscore prefix} => parses successfully', () => {
    const result = FunctionNameStub({ value: '_privateFunction' });

    expect(result).toBe('_privateFunction');
  });

  it('VALID: {value: with dollar sign} => parses successfully', () => {
    const result = FunctionNameStub({ value: '$scope' });

    expect(result).toBe('$scope');
  });
});
