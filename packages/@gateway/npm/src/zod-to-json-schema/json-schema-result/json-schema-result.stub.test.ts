import { JsonSchemaResultStub } from './json-schema-result.stub';

describe('JsonSchemaResultStub', () => {
  it('VALID: {} => the real JSON Schema for { name: string }', () => {
    expect(JsonSchemaResultStub()).toStrictEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#',
    });
  });
});
