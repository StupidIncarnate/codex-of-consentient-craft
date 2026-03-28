import { schemaLibraryStatics } from './schema-library-statics';

describe('schemaLibraryStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(schemaLibraryStatics).toStrictEqual({
      libraries: {
        all: ['zod', 'yup', 'joi', 'ajv'],
      },
    });
  });
});
