/**
 * PURPOSE: Validates TypeScript SourceFile for AST transformers
 *
 * USAGE:
 * import type { TypescriptSourceFile } from './typescript-source-file-contract';
 * // Use as opaque type passed between adapters
 */

import { z } from 'zod';

export const typescriptSourceFileContract = z
  .object({
    fileName: z.string(),
  })
  .passthrough()
  .brand<'TypescriptSourceFile'>();

export type TypescriptSourceFile = z.infer<typeof typescriptSourceFileContract>;
