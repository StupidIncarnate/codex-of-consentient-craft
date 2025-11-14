import { schemaLibraryStatics } from './schema-library-statics';

describe('schemaLibraryStatics', () => {
  it('VALID: libraries.all => contains expected schema libraries', () => {
    const { libraries } = schemaLibraryStatics;

    expect(libraries.all).toStrictEqual(['zod', 'yup', 'joi', 'ajv']);
  });

  it('VALID: libraries.all => is readonly', () => {
    const { libraries } = schemaLibraryStatics;

    expect(Object.isFrozen(libraries.all)).toBe(true);
  });
});
