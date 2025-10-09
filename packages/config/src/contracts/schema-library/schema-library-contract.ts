import { isInReadonlyArray } from '../is-in-readonly-array/is-in-readonly-array';

export const ALL_SCHEMA_LIBRARIES = ['zod'] as const;

export type SchemaLibrary = (typeof ALL_SCHEMA_LIBRARIES)[number];

export const isValidSchemaLibrary = (library: unknown): library is SchemaLibrary =>
  isInReadonlyArray({ value: library, array: ALL_SCHEMA_LIBRARIES });
