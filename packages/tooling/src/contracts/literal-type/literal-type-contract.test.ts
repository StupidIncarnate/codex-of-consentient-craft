import { LiteralTypeStub } from './literal-type.stub';

describe('literalTypeContract', () => {
  it('VALID: {value: "string"} => parses successfully', () => {
    const result = LiteralTypeStub({ value: 'string' });

    expect(result).toBe('string');
  });

  it('VALID: {value: "regex"} => parses successfully', () => {
    const result = LiteralTypeStub({ value: 'regex' });

    expect(result).toBe('regex');
  });
});
