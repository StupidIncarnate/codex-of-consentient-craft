import { JsonSchemaResultStub } from './json-schema-result.stub';

describe('JsonSchemaResultStub', () => {
  it('VALID: {} => the real JSON Schema for { name: string }', () => {
    expect(JsonSchemaResultStub()).toStrictEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: false,
    });
  });
});
