import { z } from 'zod';

/**
 * TSESTree contract - translates @typescript-eslint/utils types to branded Zod schemas.
 * Contract defines ONLY data properties (no functions).
 * Uses z.lazy() for recursive parent reference.
 */

// Base contract with type only
export const baseContract = z.object({
  type: z.string().min(1).brand<'AstNodeType'>(),
});

// Recursive base defines full object with REQUIRED parent using z.lazy()
const recursiveBase: z.ZodTypeAny = z.object({
  type: z.string().min(1).brand<'AstNodeType'>(),
  parent: z.lazy((): z.ZodTypeAny => recursiveBase).nullable(),
});

// Root level contract - parent is OPTIONAL
export const tsestreeContract = baseContract.extend({
  parent: recursiveBase.nullable().optional(),
});

export type Tsestree = z.infer<typeof tsestreeContract>;
