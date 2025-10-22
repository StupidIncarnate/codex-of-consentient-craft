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

// Branded primitive types for AST node properties
type NodeName = string & z.BRAND<'NodeName'>;

// Recursive base defines full object with REQUIRED parent using z.lazy()
// Output type (after parsing)
interface RecursiveNodeOutput {
  type: TsestreeNodeTypeValue;
  parent?: RecursiveNodeOutput | null | undefined;
  init?: RecursiveNodeOutput | null | undefined;
  returnType?: RecursiveNodeOutput | null | undefined;
  typeAnnotation?: RecursiveNodeOutput | null | undefined;
  // CallExpression properties
  callee?: RecursiveNodeOutput | null | undefined;
  arguments?: (RecursiveNodeOutput | null)[] | undefined;
  // MemberExpression properties
  object?: RecursiveNodeOutput | null | undefined;
  property?: RecursiveNodeOutput | null | undefined;
  // Identifier properties
  name?: NodeName | undefined;
  // VariableDeclarator properties
  id?: RecursiveNodeOutput | null | undefined;
  // ImportDeclaration properties
  specifiers?: RecursiveNodeOutput[] | undefined;
  source?: RecursiveNodeOutput | null | undefined;
  // ImportSpecifier properties
  imported?: RecursiveNodeOutput | null | undefined;
  local?: RecursiveNodeOutput | null | undefined;
  // Literal properties
  value?: unknown;
  // TSAsExpression properties
  expression?: RecursiveNodeOutput | null | undefined;
  // Function properties (ArrowFunctionExpression, FunctionDeclaration, FunctionExpression)
  params?: RecursiveNodeOutput[] | undefined;
  // body can be a single node (arrow function expression) or array (BlockStatement)
  body?: RecursiveNodeOutput | RecursiveNodeOutput[] | null | undefined;
  // AssignmentPattern properties
  left?: RecursiveNodeOutput | null | undefined;
  // ObjectPattern/ObjectExpression properties
  properties?: RecursiveNodeOutput[] | undefined;
  // SpreadElement/ReturnStatement properties
  argument?: RecursiveNodeOutput | null | undefined;
  // VariableDeclaration properties
  declarations?: RecursiveNodeOutput[] | undefined;
  kind?: 'const' | 'let' | 'var' | undefined;
  // Property properties
  key?: RecursiveNodeOutput | null | undefined;
  // TSTypeReference properties
  typeName?: RecursiveNodeOutput | null | undefined;
  // TSPropertySignature properties
  optional?: boolean | undefined;
  // TSTypeLiteral properties
  members?: RecursiveNodeOutput[] | undefined;
  // ExportNamedDeclaration properties
  exportKind?: 'type' | 'value' | undefined;
  declaration?: RecursiveNodeOutput | null | undefined;
  // ImportDeclaration additional properties
  importKind?: 'type' | 'value' | undefined;
}

// Input type (before parsing)
interface RecursiveNodeInput {
  type: TsestreeNodeTypeValue;
  parent?: RecursiveNodeInput | null | undefined;
  init?: RecursiveNodeInput | null | undefined;
  returnType?: RecursiveNodeInput | null | undefined;
  typeAnnotation?: RecursiveNodeInput | null | undefined;
  // CallExpression properties
  callee?: RecursiveNodeInput | null | undefined;
  arguments?: (RecursiveNodeInput | null)[] | undefined;
  // MemberExpression properties
  object?: RecursiveNodeInput | null | undefined;
  property?: RecursiveNodeInput | null | undefined;
  // Identifier properties
  name?: string | undefined;
  // VariableDeclarator properties
  id?: RecursiveNodeInput | null | undefined;
  // ImportDeclaration properties
  specifiers?: RecursiveNodeInput[] | undefined;
  source?: RecursiveNodeInput | null | undefined;
  // ImportSpecifier properties
  imported?: RecursiveNodeInput | null | undefined;
  local?: RecursiveNodeInput | null | undefined;
  // Literal properties
  value?: unknown;
  // TSAsExpression properties
  expression?: RecursiveNodeInput | null | undefined;
  // Function properties (ArrowFunctionExpression, FunctionDeclaration, FunctionExpression)
  params?: RecursiveNodeInput[] | undefined;
  // body can be a single node (arrow function expression) or array (BlockStatement)
  body?: RecursiveNodeInput | RecursiveNodeInput[] | null | undefined;
  // AssignmentPattern properties
  left?: RecursiveNodeInput | null | undefined;
  // ObjectPattern/ObjectExpression properties
  properties?: RecursiveNodeInput[] | undefined;
  // SpreadElement/ReturnStatement properties
  argument?: RecursiveNodeInput | null | undefined;
  // VariableDeclaration properties
  declarations?: RecursiveNodeInput[] | undefined;
  kind?: 'const' | 'let' | 'var' | undefined;
  // Property properties
  key?: RecursiveNodeInput | null | undefined;
  // TSTypeReference properties
  typeName?: RecursiveNodeInput | null | undefined;
  // TSPropertySignature properties
  optional?: boolean | undefined;
  // TSTypeLiteral properties
  members?: RecursiveNodeInput[] | undefined;
  // ExportNamedDeclaration properties
  exportKind?: 'type' | 'value' | undefined;
  declaration?: RecursiveNodeInput | null | undefined;
  // ImportDeclaration additional properties
  importKind?: 'type' | 'value' | undefined;
}

const recursiveBase: z.ZodType<RecursiveNodeOutput, z.ZodTypeDef, RecursiveNodeInput> = z.object({
  type: z.enum(nodeTypeValues),
  parent: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  init: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  returnType: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  typeAnnotation: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // CallExpression properties
  callee: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  arguments: z.array(z.lazy(() => recursiveBase).nullable()).optional(),
  // MemberExpression properties
  object: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  property: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // Identifier properties
  name: z.string().brand<'NodeName'>().optional(),
  // VariableDeclarator properties
  id: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // ImportDeclaration properties
  specifiers: z.array(z.lazy(() => recursiveBase)).optional(),
  source: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // ImportSpecifier properties
  imported: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  local: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // Literal properties
  value: z.unknown().optional(),
  // TSAsExpression properties
  expression: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // Function properties (ArrowFunctionExpression, FunctionDeclaration, FunctionExpression)
  params: z.array(z.lazy(() => recursiveBase)).optional(),
  // body can be a single node (arrow function expression) or array (BlockStatement)
  body: z
    .union([z.lazy(() => recursiveBase), z.array(z.lazy(() => recursiveBase))])
    .nullable()
    .optional(),
  // AssignmentPattern properties
  left: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // ObjectPattern/ObjectExpression properties
  properties: z.array(z.lazy(() => recursiveBase)).optional(),
  // SpreadElement/ReturnStatement properties
  argument: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // VariableDeclaration properties
  declarations: z.array(z.lazy(() => recursiveBase)).optional(),
  kind: z.enum(['const', 'let', 'var']).optional(),
  // Property properties
  key: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // TSTypeReference properties
  typeName: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // TSPropertySignature properties
  optional: z.boolean().optional(),
  // TSTypeLiteral properties
  members: z.array(z.lazy(() => recursiveBase)).optional(),
  // ExportNamedDeclaration properties
  exportKind: z.enum(['type', 'value']).optional(),
  declaration: z
    .lazy(() => recursiveBase)
    .nullable()
    .optional(),
  // ImportDeclaration additional properties
  importKind: z.enum(['type', 'value']).optional(),
}) as unknown as z.ZodType<RecursiveNodeOutput, z.ZodTypeDef, RecursiveNodeInput>;

// Root level contract - parent is OPTIONAL
export const tsestreeContract = z.object({
  type: z.enum(nodeTypeValues),
  parent: recursiveBase.nullable().optional(),
  init: recursiveBase.nullable().optional(),
  returnType: recursiveBase.nullable().optional(),
  typeAnnotation: recursiveBase.nullable().optional(),
  // CallExpression properties
  callee: recursiveBase.nullable().optional(),
  arguments: z.array(recursiveBase.nullable()).optional(),
  // MemberExpression properties
  object: recursiveBase.nullable().optional(),
  property: recursiveBase.nullable().optional(),
  // Identifier properties
  name: z.string().brand<'NodeName'>().optional(),
  // VariableDeclarator properties
  id: recursiveBase.nullable().optional(),
  // ImportDeclaration properties
  specifiers: z.array(recursiveBase).optional(),
  source: recursiveBase.nullable().optional(),
  // ImportSpecifier properties
  imported: recursiveBase.nullable().optional(),
  local: recursiveBase.nullable().optional(),
  // Literal properties
  value: z.unknown().optional(),
  // TSAsExpression properties
  expression: recursiveBase.nullable().optional(),
  // Function properties (ArrowFunctionExpression, FunctionDeclaration, FunctionExpression)
  params: z.array(recursiveBase).optional(),
  // body can be a single node (arrow function expression) or array (BlockStatement)
  body: z
    .union([recursiveBase, z.array(recursiveBase)])
    .nullable()
    .optional(),
  // AssignmentPattern properties
  left: recursiveBase.nullable().optional(),
  // ObjectPattern/ObjectExpression properties
  properties: z.array(recursiveBase).optional(),
  // SpreadElement/ReturnStatement properties
  argument: recursiveBase.nullable().optional(),
  // VariableDeclaration properties
  declarations: z.array(recursiveBase).optional(),
  kind: z.enum(['const', 'let', 'var']).optional(),
  // Property properties
  key: recursiveBase.nullable().optional(),
  // TSTypeReference properties
  typeName: recursiveBase.nullable().optional(),
  // TSPropertySignature properties
  optional: z.boolean().optional(),
  // TSTypeLiteral properties
  members: z.array(recursiveBase).optional(),
  // ExportNamedDeclaration properties
  exportKind: z.enum(['type', 'value']).optional(),
  declaration: recursiveBase.nullable().optional(),
  // ImportDeclaration additional properties
  importKind: z.enum(['type', 'value']).optional(),
});

export type Tsestree = z.infer<typeof tsestreeContract>;
