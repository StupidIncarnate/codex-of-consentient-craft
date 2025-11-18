import { identifierContract as _identifierContract } from './identifier-contract';
import { IdentifierStub } from './identifier.stub';

describe('identifierContract', () => {
  it('VALID: "myVariable" => parses successfully', () => {
    const result = IdentifierStub({ value: 'myVariable' });

    expect(result).toBe('myVariable');
  });

  it('VALID: "my_variable" => parses successfully', () => {
    const result = IdentifierStub({ value: 'my_variable' });

    expect(result).toBe('my_variable');
  });

  it('VALID: "myVariable123" => parses successfully', () => {
    const result = IdentifierStub({ value: 'myVariable123' });

    expect(result).toBe('myVariable123');
  });

  it('VALID: "" => parses successfully', () => {
    // While not a valid JS identifier, the contract accepts any string
    // Validation of actual identifier rules would be done at a higher level
    const result = IdentifierStub({ value: '' });

    expect(result).toBe('');
  });
});
