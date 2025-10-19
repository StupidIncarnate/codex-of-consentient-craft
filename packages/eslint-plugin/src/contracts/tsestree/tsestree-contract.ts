import { z } from 'zod';
import { tsestreeNodeTypeStatics } from '../../statics/tsestree-node-type/tsestree-node-type-statics';

// Extract literal type union from statics
type TsestreeNodeTypeValue =
  (typeof tsestreeNodeTypeStatics.nodeTypes)[keyof typeof tsestreeNodeTypeStatics.nodeTypes];

// Create tuple of literal values for z.enum (preserves literal types)
const nodeTypeValues = Object.values(tsestreeNodeTypeStatics.nodeTypes) as [
  TsestreeNodeTypeValue,
  ...TsestreeNodeTypeValue[],
];

/**
 * TSESTree contract - translates @typescript-eslint/utils types to Zod schemas.
 * Contract defines ONLY data properties (no functions).
 * Uses z.lazy() for recursive parent reference.
 * Type property constrained to TsestreeNodeType enum values.
 */

// Recursive base defines full object with REQUIRED parent using z.lazy()
// Output type (after parsing)
interface RecursiveNodeOutput {
  type: TsestreeNodeTypeValue;
  parent?: RecursiveNodeOutput | null | undefined;
}

// Input type (before parsing)
interface RecursiveNodeInput {
  type: TsestreeNodeTypeValue;
  parent?: RecursiveNodeInput | null | undefined;
}

const recursiveBase: z.ZodType<RecursiveNodeOutput, z.ZodTypeDef, RecursiveNodeInput> = z.object({
  type: z.enum(nodeTypeValues),
  parent: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
}) as unknown as z.ZodType<RecursiveNodeOutput, z.ZodTypeDef, RecursiveNodeInput>;

// Root level contract - parent is OPTIONAL
export const tsestreeContract = z.object({
  type: z.enum(nodeTypeValues),
  parent: recursiveBase.nullable().optional(),
});

export type Tsestree = z.infer<typeof tsestreeContract>;
