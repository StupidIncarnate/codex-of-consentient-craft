/**
 * PURPOSE: Validates TypeScript ESTree AST nodes with recursive parent references
 *
 * USAGE:
 * const node = tsestreeContract.parse({
 *   type: 'Identifier',
 *   name: 'myVariable' as Identifier,
 *   parent: { type: 'VariableDeclarator', ... }
 * });
 * // Returns a validated Tsestree AST node with type-safe recursive structure
 *
 * TSESTree contract - translates @typescript-eslint/utils types to Zod schemas.
 * Contract defines ONLY data properties (no functions).
 * Every recursive field is a GETTER returning `z.core.$ZodType<TsestreeSelf>` (or an
 * array/union/nullable built from it) — zod v4 has no `z.ZodTypeDef` to hand-annotate a
 * `z.lazy()` cast against, so the getter form is what makes this self-reference typecheck. The
 * root and the recursive "base" used to be two structurally identical objects (one for the
 * top-level parse, one `z.lazy()`-referenced from within itself); a getter needs no such split,
 * since `tsestreeContract` can refer to itself directly once it exists.
 * Type property constrained to TsestreeNodeType enum values.
 */
import { z } from 'zod';
import { tsestreeNodeTypeStatics } from '../../statics/tsestree-node-type/tsestree-node-type-statics';
import { identifierContract } from '@dungeonmaster/shared/contracts';

// Extract literal type union from statics
type TsestreeNodeTypeValue =
  (typeof tsestreeNodeTypeStatics.nodeTypes)[keyof typeof tsestreeNodeTypeStatics.nodeTypes];

// Create tuple of literal values for z.enum (preserves literal types)
const nodeTypeValues = Object.values(tsestreeNodeTypeStatics.nodeTypes) as [
  TsestreeNodeTypeValue,
  ...TsestreeNodeTypeValue[],
];

// Every field this contract validates WITHOUT recursing into another node.
const tsestreeFields = z.object({
  type: z.enum(nodeTypeValues),
  range: z.tuple([z.unknown(), z.unknown()]).readonly().optional(),
  // MemberExpression properties — `computed` also applies to Property (an object literal's
  // `{[x]: 1}` vs `{x: 1}`), so platform-globals-ban reads it on both node types
  computed: z.boolean().optional(),
  // Identifier properties
  name: identifierContract.optional(),
  // Literal properties
  value: z.unknown().optional(),
  // VariableDeclaration properties
  kind: z.enum(['const', 'let', 'var']).optional(),
  // Property properties
  shorthand: z.boolean().optional(),
  // TSPropertySignature properties
  optional: z.boolean().optional(),
  // ExportNamedDeclaration properties
  exportKind: z.enum(['type', 'value']).optional(),
  // ImportDeclaration additional properties
  importKind: z.enum(['type', 'value']).optional(),
  // UnaryExpression / BinaryExpression / LogicalExpression / AssignmentExpression operator
  operator: z
    .enum([
      'typeof',
      'void',
      'delete',
      '!',
      '-',
      '+',
      '~',
      '==',
      '!=',
      '===',
      '!==',
      '<',
      '<=',
      '>',
      '>=',
      '<<',
      '>>',
      '>>>',
      '*',
      '/',
      '%',
      '**',
      '|',
      '^',
      '&',
      '&&',
      '||',
      '??',
      'in',
      'instanceof',
    ])
    .optional(),
  // Literal regex properties (ESLint AST stores /pattern/flags as {regex: {pattern, flags}})
  regex: z.object({ pattern: z.unknown().optional(), flags: z.unknown().optional() }).optional(),
});

// The recursive shape, expressed once and reused by every getter's return type below — never
// hand-written per field, so a new recursive field only ever adds one line to THIS type and one
// getter, never a second copy of either.
type TsestreeSelf = z.infer<typeof tsestreeFields> & {
  parent?: TsestreeSelf | null | undefined;
  init?: TsestreeSelf | null | undefined;
  returnType?: TsestreeSelf | null | undefined;
  typeAnnotation?: TsestreeSelf | null | undefined;
  // CallExpression properties
  callee?: TsestreeSelf | null | undefined;
  arguments?: (TsestreeSelf | null)[] | undefined;
  // MemberExpression properties
  object?: TsestreeSelf | null | undefined;
  property?: TsestreeSelf | null | undefined;
  // VariableDeclarator properties
  id?: TsestreeSelf | null | undefined;
  // ImportDeclaration/ExportDeclaration properties
  specifiers?: TsestreeSelf[] | undefined;
  source?: TsestreeSelf | null | undefined;
  // ImportSpecifier/ExportSpecifier properties
  imported?: TsestreeSelf | null | undefined;
  local?: TsestreeSelf | null | undefined;
  exported?: TsestreeSelf | null | undefined;
  // TSAsExpression properties
  expression?: TsestreeSelf | null | undefined;
  // Function properties (ArrowFunctionExpression, FunctionDeclaration, FunctionExpression)
  params?: TsestreeSelf[] | undefined;
  // body can be a single node (arrow function expression) or array (BlockStatement)
  body?: TsestreeSelf | TsestreeSelf[] | null | undefined;
  // AssignmentPattern properties
  left?: TsestreeSelf | null | undefined;
  // ObjectPattern/ObjectExpression properties
  properties?: TsestreeSelf[] | undefined;
  // SpreadElement/ReturnStatement properties
  argument?: TsestreeSelf | null | undefined;
  // VariableDeclaration properties
  declarations?: TsestreeSelf[] | undefined;
  // Property properties
  key?: TsestreeSelf | null | undefined;
  // TSTypeReference properties
  typeName?: TsestreeSelf | null | undefined;
  // TSTypeParameterInstantiation properties (typeArguments in @typescript-eslint v6+)
  typeParameters?: TsestreeSelf | null | undefined;
  typeArguments?: TsestreeSelf | null | undefined;
  // TSTypeLiteral properties
  members?: TsestreeSelf[] | undefined;
  // TSIndexedAccessType properties — `objectType[indexType]`, as in WorkItem['summary']
  objectType?: TsestreeSelf | null | undefined;
  indexType?: TsestreeSelf | null | undefined;
  // JSXElement / JSXFragment properties
  openingElement?: TsestreeSelf | null | undefined;
  children?: TsestreeSelf[] | undefined;
  // ExportNamedDeclaration properties
  declaration?: TsestreeSelf | null | undefined;
  // ClassDeclaration/ClassExpression properties — `extends <X>`, null when a class extends nothing
  superClass?: TsestreeSelf | null | undefined;
  // TSArrayType properties (elementType is alternate to typeAnnotation for some parsers)
  elementType?: TsestreeSelf | null | undefined;
  // ArrayExpression properties
  elements?: (TsestreeSelf | null)[] | undefined;
  // BinaryExpression / LogicalExpression / AssignmentExpression / AssignmentPattern right-hand side
  right?: TsestreeSelf | null | undefined;
  // SwitchStatement properties
  discriminant?: TsestreeSelf | null | undefined;
  cases?: TsestreeSelf[] | undefined;
  // SwitchCase properties
  test?: TsestreeSelf | null | undefined;
  consequent?: TsestreeSelf | TsestreeSelf[] | null | undefined;
  // ConditionalExpression / IfStatement else-branch
  alternate?: TsestreeSelf | TsestreeSelf[] | null | undefined;
  // TemplateLiteral properties — quasis are the static string segments (TemplateElement, whose
  // own `value` is `{raw, cooked}`, carried through the existing untyped `value` field);
  // expressions are the interpolated parts between them
  quasis?: TsestreeSelf[] | undefined;
  expressions?: TsestreeSelf[] | undefined;
  // TSLiteralType properties — a string/number/boolean literal used in TYPE position, e.g. the
  // `'#GatewayWalkedFile'` in `.brand<'#GatewayWalkedFile'>()`; `literal` is the inner Literal node,
  // whose own `value` (already on this interface) carries the actual string/number/boolean.
  literal?: TsestreeSelf | null | undefined;
};

// The four recursive shapes every getter below returns, spelled out once each.
type TsestreeNodeSchema = z.ZodOptional<z.ZodNullable<z.core.$ZodType<TsestreeSelf>>>;
type TsestreeArraySchema = z.ZodOptional<z.ZodArray<z.core.$ZodType<TsestreeSelf>>>;
type TsestreeNullableArraySchema = z.ZodOptional<
  z.ZodArray<z.ZodNullable<z.core.$ZodType<TsestreeSelf>>>
>;
type TsestreeNodeOrArraySchema = z.ZodOptional<
  z.ZodNullable<
    z.ZodUnion<readonly [z.core.$ZodType<TsestreeSelf>, z.ZodArray<z.core.$ZodType<TsestreeSelf>>]>
  >
>;

export const tsestreeContract = z.object({
  ...tsestreeFields.shape,
  get parent(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get init(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get returnType(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get typeAnnotation(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get callee(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get arguments(): TsestreeNullableArraySchema {
    return z.array(tsestreeContract.nullable()).optional();
  },
  get object(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get property(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get id(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get specifiers(): TsestreeArraySchema {
    return z.array(tsestreeContract).optional();
  },
  get source(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get imported(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get local(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get exported(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get expression(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get params(): TsestreeArraySchema {
    return z.array(tsestreeContract).optional();
  },
  get body(): TsestreeNodeOrArraySchema {
    return z
      .union([tsestreeContract, z.array(tsestreeContract)])
      .nullable()
      .optional();
  },
  get left(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get properties(): TsestreeArraySchema {
    return z.array(tsestreeContract).optional();
  },
  get argument(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get declarations(): TsestreeArraySchema {
    return z.array(tsestreeContract).optional();
  },
  get key(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get typeName(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get typeParameters(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get typeArguments(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get members(): TsestreeArraySchema {
    return z.array(tsestreeContract).optional();
  },
  get objectType(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get indexType(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get openingElement(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get children(): TsestreeArraySchema {
    return z.array(tsestreeContract).optional();
  },
  get declaration(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get superClass(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get elementType(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get elements(): TsestreeNullableArraySchema {
    return z.array(tsestreeContract.nullable()).optional();
  },
  get right(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get discriminant(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get cases(): TsestreeArraySchema {
    return z.array(tsestreeContract).optional();
  },
  get test(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
  get consequent(): TsestreeNodeOrArraySchema {
    return z
      .union([tsestreeContract, z.array(tsestreeContract)])
      .nullable()
      .optional();
  },
  get alternate(): TsestreeNodeOrArraySchema {
    return z
      .union([tsestreeContract, z.array(tsestreeContract)])
      .nullable()
      .optional();
  },
  get quasis(): TsestreeArraySchema {
    return z.array(tsestreeContract).optional();
  },
  get expressions(): TsestreeArraySchema {
    return z.array(tsestreeContract).optional();
  },
  get literal(): TsestreeNodeSchema {
    return tsestreeContract.nullable().optional();
  },
});

export type Tsestree = z.infer<typeof tsestreeContract>;
