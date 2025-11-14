import { schemaLibraryContract } from './schema-library-contract';
import type { SchemaLibrary } from './schema-library-contract';

export const SchemaLibraryStub = (
  { value }: { value?: string } = { value: 'zod' },
): SchemaLibrary => schemaLibraryContract.parse(value);
