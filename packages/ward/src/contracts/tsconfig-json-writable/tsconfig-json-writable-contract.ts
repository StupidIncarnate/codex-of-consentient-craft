/**
 * PURPOSE: Validates the tsconfig.json shape that ward writes when syncing project references
 *
 * USAGE:
 * tsconfigJsonWritableContract.parse({ references: [{ path: '../shared' }], compilerOptions: { composite: true } });
 * // Returns: TsconfigJsonWritable validated object with optional references, compilerOptions, include, exclude
 */

import { z } from 'zod';

export const tsconfigJsonWritableContract = z
  .object({
    compilerOptions: z
      .object({
        composite: z.boolean().optional(),
        noEmit: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    references: z.array(z.object({ path: z.string().brand<'TsconfigReferencePath'>() })).optional(),
    include: z.array(z.string().brand<'TsconfigInclude'>()).optional(),
    exclude: z.array(z.string().brand<'TsconfigExclude'>()).optional(),
  })
  .passthrough();

export type TsconfigJsonWritable = z.infer<typeof tsconfigJsonWritableContract>;
