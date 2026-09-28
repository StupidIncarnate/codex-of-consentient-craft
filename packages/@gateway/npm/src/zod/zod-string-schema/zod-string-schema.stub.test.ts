import { ZodStringSchemaStub } from './zod-string-schema.stub';

describe('ZodStringSchemaStub', () => {
  it('VALID: {} => a real schema that parses a real string', () => {
    expect(ZodStringSchemaStub().parse('gateway-stub')).toBe('gateway-stub');
  });

  it('INVALID: {} => a real schema that throws for a non-string', () => {
    expect(() => ZodStringSchemaStub().parse(123)).toThrow(
      /"message": "Invalid input: expected string, received number"/u,
    );
  });
});
