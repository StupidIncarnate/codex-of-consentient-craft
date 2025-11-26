/**
 * PURPOSE: Immutable configuration values for TypeScript proxy mock transformer
 *
 * USAGE:
 * import { typescriptTransformerStatics } from './typescript-transformer-statics';
 * typescriptTransformerStatics.name; // 'jest-proxy-mock-transformer'
 * typescriptTransformerStatics.version; // 1
 */

export const typescriptTransformerStatics = {
  name: 'jest-proxy-mock-transformer',
  version: 1,
} as const;
