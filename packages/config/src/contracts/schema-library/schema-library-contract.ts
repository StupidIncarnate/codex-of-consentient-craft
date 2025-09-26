export type SchemaLibrary = 'zod' | 'yup' | 'joi' | 'io-ts' | 'typebox' | 'class-validator';

export const ALL_SCHEMA_LIBRARIES: readonly SchemaLibrary[] = [
  'zod',
  'yup',
  'joi',
  'io-ts',
  'typebox',
  'class-validator',
] as const;

export const isValidSchemaLibrary = (library: unknown): library is SchemaLibrary =>
  typeof library === 'string' && ALL_SCHEMA_LIBRARIES.includes(library as SchemaLibrary);
