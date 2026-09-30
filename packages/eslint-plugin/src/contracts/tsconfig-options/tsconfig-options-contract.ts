/**
 * PURPOSE: Defines the schema for TypeScript compiler options with validation and type-safety
 *
 * USAGE:
 * const options = tsconfigOptionsContract.parse({
 *   target: 'ES2020',
 *   module: 'commonjs',
 *   strict: true,
 *   noEmit: false
 * });
 * // Returns validated TsconfigOptions with branded types for string fields
 */
import { z } from '#gateway/npm/zod';

export const tsconfigOptionsContract = z
  .object({
    target: z.string().brand<'TsconfigOptionsTarget'>().optional(),
    module: z.string().brand<'TsconfigOptionsModule'>().optional(),
    lib: z.array(z.string().brand<'TsconfigOptionsLib'>()).optional(),
    strict: z.boolean().optional(),
    noEmit: z.boolean().optional(),
    esModuleInterop: z.boolean().optional(),
    skipLibCheck: z.boolean().optional(),
    forceConsistentCasingInFileNames: z.boolean().optional(),
    resolveJsonModule: z.boolean().optional(),
    moduleResolution: z.string().brand<'TsconfigOptionsModuleResolution'>().optional(),
    allowJs: z.boolean().optional(),
    checkJs: z.boolean().optional(),
    noUnusedLocals: z.boolean().optional(),
    noUnusedParameters: z.boolean().optional(),
    noImplicitReturns: z.boolean().optional(),
    noFallthroughCasesInSwitch: z.boolean().optional(),
    allowUnreachableCode: z.boolean().optional(),
    noImplicitAny: z.boolean().optional(),
    strictNullChecks: z.boolean().optional(),
    exactOptionalPropertyTypes: z.boolean().optional(),
    noUncheckedIndexedAccess: z.boolean().optional(),
    declaration: z.boolean().optional(),
    declarationMap: z.boolean().optional(),
  })
  .brand<'TsconfigOptions'>();

export type TsconfigOptions = z.infer<typeof tsconfigOptionsContract>;
