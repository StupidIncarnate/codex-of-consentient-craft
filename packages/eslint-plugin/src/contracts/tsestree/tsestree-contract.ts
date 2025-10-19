import { z } from 'zod';

/**
 * TSESTree contract - translates @typescript-eslint/utils types to branded Zod schemas.
 * Contract defines ONLY data properties (no functions).
 * Uses z.lazy() for recursive parent reference.
 */

// Base contract with type only
const baseContract = z.object({
  type: z.string().min(1).brand<'AstNodeType'>(),
});

// Recursive base defines full object with REQUIRED parent using z.lazy()
// Output type (after parsing)
interface RecursiveNodeOutput {
  type: z.BRAND<'AstNodeType'>;
  parent?: RecursiveNodeOutput | null | undefined;
}

// Input type (before parsing)
// Brand type alias to satisfy ban-primitives lint rule
type AstNodeTypeBrand = z.BRAND<'AstNodeType'>;

interface RecursiveNodeInput {
  type: AstNodeTypeBrand;
  parent?: RecursiveNodeInput | null | undefined;
}

const recursiveBase: z.ZodType<RecursiveNodeOutput, z.ZodTypeDef, RecursiveNodeInput> = z.object({
  type: z.string().min(1).brand<'AstNodeType'>(),
  parent: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
}) as unknown as z.ZodType<RecursiveNodeOutput, z.ZodTypeDef, RecursiveNodeInput>;

// Root level contract - parent is OPTIONAL
export const tsestreeContract = baseContract.extend({
  parent: recursiveBase.nullable().optional(),
});

export type Tsestree = z.infer<typeof tsestreeContract>;
