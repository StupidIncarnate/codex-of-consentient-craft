/**
 * PURPOSE: Says how a contract file's exported type relates to the schemas in that file. Reach for
 * this to tell a type inferred from a schema (`z.infer<typeof xContract>`) from the three shapes Zod
 * has no schema for: a function type or method set (a call-signature property and a `length`
 * member included), and data plus functions
 * (`z.infer<typeof xContract> & { send: () => void }`). A reference to a type alias or interface
 * declared in the same file (`typeAliases`) is read through to its right-hand side, at the top of
 * the type, as an intersection member and as a property type. An interface keyed only by a same-file
 * `unique symbol` const (`uniqueSymbolNames`), and `Record`/`Readonly` of one, is a 'phantom' carrier.
 *
 * USAGE:
 * typeNodeShapeClassifyLayerTransformer({ node: typeAlias.type, schemaNames: [IdentifierStub()] });
 * // Returns 'inferred' | 'functions' | 'data-plus-functions' | 'phantom' | 'other'
 */
import * as ts from '#gateway/npm/typescript';

import type { Identifier } from '../../contracts/identifier/identifier-contract';
import { lengthPickDetectLayerTransformer } from './length-pick-detect-layer-transformer';
import { phantomInterfaceDetectLayerTransformer } from './phantom-interface-detect-layer-transformer';
import { typeAliasResolveLayerTransformer } from './type-alias-resolve-layer-transformer';
import { typeMemberKindsLayerTransformer } from './type-member-kinds-layer-transformer';
import { contractIndexStatics } from '../../statics/contract-index/contract-index-statics';

const INFER_NAMES = contractIndexStatics.types.inferNames;
const WRAPPER_NAMES = contractIndexStatics.types.wrapperNames;

export const typeNodeShapeClassifyLayerTransformer = ({
  node,
  schemaNames,
  typeAliases = [],
  uniqueSymbolNames = [],
  visitedNames = [],
}: {
  node: ts.Node;
  schemaNames: readonly Identifier[];
  typeAliases?: readonly { name: Identifier; node: ts.Node }[];
  uniqueSymbolNames?: readonly Identifier[];
  visitedNames?: readonly Identifier[];
}): 'inferred' | 'functions' | 'data-plus-functions' | 'phantom' | 'other' => {
  if (ts.isParenthesizedTypeNode(node)) {
    return typeNodeShapeClassifyLayerTransformer({
      node: node.type,
      schemaNames,
      typeAliases,
      uniqueSymbolNames,
      visitedNames,
    });
  }

  if (ts.isFunctionTypeNode(node)) {
    return 'functions';
  }

  if (ts.isTypeLiteralNode(node) || ts.isInterfaceDeclaration(node)) {
    const { members } = node;
    const memberKinds = typeMemberKindsLayerTransformer({ members, typeAliases, visitedNames });
    if (
      ts.isInterfaceDeclaration(node) &&
      phantomInterfaceDetectLayerTransformer({ declaration: node, uniqueSymbolNames })
    ) {
      return 'phantom';
    }
    const isMethodSet = memberKinds.includes('function') && !memberKinds.includes('data');
    return isMethodSet && !(ts.isInterfaceDeclaration(node) && node.heritageClauses !== undefined)
      ? 'functions'
      : 'other';
  }

  if (ts.isTypeReferenceNode(node)) {
    const { typeName, typeArguments } = node;
    const [firstArgument] = typeArguments ?? [];

    if (
      ts.isQualifiedName(typeName) &&
      ts.isIdentifier(typeName.left) &&
      typeName.left.text === 'z' &&
      INFER_NAMES.some((inferName) => inferName === typeName.right.text)
    ) {
      return firstArgument !== undefined &&
        ts.isTypeQueryNode(firstArgument) &&
        ts.isIdentifier(firstArgument.exprName) &&
        schemaNames.some((schemaName) => String(schemaName) === firstArgument.exprName.getText())
        ? 'inferred'
        : 'other';
    }

    if (ts.isIdentifier(typeName) && typeName.text === 'Readonly' && firstArgument !== undefined) {
      const wrapped = typeNodeShapeClassifyLayerTransformer({
        node: firstArgument,
        schemaNames,
        typeAliases,
        uniqueSymbolNames,
        visitedNames,
      });
      return wrapped === 'functions' || wrapped === 'phantom' ? wrapped : 'other';
    }

    const [, recordValue] = typeArguments ?? [];
    if (ts.isIdentifier(typeName) && typeName.text === 'Record' && recordValue !== undefined) {
      return typeNodeShapeClassifyLayerTransformer({
        node: recordValue,
        schemaNames,
        typeAliases,
        uniqueSymbolNames,
        visitedNames,
      }) === 'phantom'
        ? 'phantom'
        : 'other';
    }

    if (lengthPickDetectLayerTransformer({ node })) {
      return 'functions';
    }

    if (
      ts.isIdentifier(typeName) &&
      WRAPPER_NAMES.some((wrapperName) => wrapperName === typeName.text)
    ) {
      return firstArgument !== undefined &&
        typeNodeShapeClassifyLayerTransformer({
          node: firstArgument,
          schemaNames,
          typeAliases,
          uniqueSymbolNames,
          visitedNames,
        }) === 'inferred'
        ? 'inferred'
        : 'other';
    }

    const alias = typeAliasResolveLayerTransformer({ typeNode: node, typeAliases, visitedNames });
    return alias === undefined
      ? 'other'
      : typeNodeShapeClassifyLayerTransformer({
          node: alias.node,
          schemaNames,
          typeAliases,
          uniqueSymbolNames,
          visitedNames: [...visitedNames, alias.name],
        });
  }

  if (ts.isIntersectionTypeNode(node)) {
    const shapes = node.types.map((member) =>
      typeNodeShapeClassifyLayerTransformer({
        node: member,
        schemaNames,
        typeAliases,
        uniqueSymbolNames,
        visitedNames,
      }),
    );
    if (shapes.every((shape) => shape === 'functions')) {
      return 'functions';
    }
    if (shapes.every((shape) => shape === 'inferred')) {
      return 'inferred';
    }
    if (
      shapes.some((shape) => shape === 'inferred') &&
      shapes.every((shape) => shape === 'inferred' || shape === 'functions')
    ) {
      return 'data-plus-functions';
    }
    return 'other';
  }

  return 'other';
};
