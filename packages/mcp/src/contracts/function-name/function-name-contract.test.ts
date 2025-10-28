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
});
