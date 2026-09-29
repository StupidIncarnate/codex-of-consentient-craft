/**
 * PURPOSE: Says how a contract file's exported type relates to the schemas in that file. Reach for
 * this to tell a type inferred from a schema (`z.infer<typeof xContract>`) from the three shapes Zod
 * has no schema for: a function type or method set (a call-signature property and a `length`
 * member included), and data plus functions
 * (`z.infer<typeof xContract> & { send: () => void }`).
 *
 * USAGE:
 * typeNodeShapeClassifyLayerTransformer({ node: typeAlias.type, schemaNames: [IdentifierStub()] });
 * // Returns 'inferred' | 'functions' | 'data-plus-functions' | 'other'
 */
import * as ts from '#gateway/npm/typescript';

import type { Identifier } from '../../contracts/identifier/identifier-contract';
import { contractIndexStatics } from '../../statics/contract-index/contract-index-statics';

const INFER_NAMES = contractIndexStatics.types.inferNames;
const WRAPPER_NAMES = contractIndexStatics.types.wrapperNames;

export const typeNodeShapeClassifyLayerTransformer = ({
  node,
  schemaNames,
}: {
  node: ts.Node;
  schemaNames: readonly Identifier[];
}): 'inferred' | 'functions' | 'data-plus-functions' | 'other' => {
  if (ts.isParenthesizedTypeNode(node)) {
    return typeNodeShapeClassifyLayerTransformer({ node: node.type, schemaNames });
  }

  if (ts.isFunctionTypeNode(node)) {
    return 'functions';
  }

  if (ts.isTypeLiteralNode(node) || ts.isInterfaceDeclaration(node)) {
    const { members } = node;
    const memberKinds = members.map((member) => {
      if (ts.isMethodSignature(member)) {
        return 'function';
      }
      if (!ts.isPropertySignature(member) || member.type === undefined) {
        return 'data';
      }
      if (ts.isFunctionTypeNode(member.type)) {
        return 'function';
      }
      if (
        ts.isTypeLiteralNode(member.type) &&
        member.type.members.length > 0 &&
        member.type.members.every((inner) => inner.kind === ts.SyntaxKind.CallSignature)
      ) {
        return 'function';
      }
      return ts.isIdentifier(member.name) &&
        member.name.text === 'length' &&
        member.type.kind === ts.SyntaxKind.NumberKeyword
        ? 'length'
        : 'data';
    });
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
      return typeNodeShapeClassifyLayerTransformer({ node: firstArgument, schemaNames }) ===
        'functions'
        ? 'functions'
        : 'other';
    }

    const [, keyArgument] = typeArguments ?? [];
    if (
      ts.isIdentifier(typeName) &&
      typeName.text === 'Pick' &&
      firstArgument !== undefined &&
      firstArgument.kind === ts.SyntaxKind.ArrayType &&
      keyArgument !== undefined &&
      keyArgument.kind === ts.SyntaxKind.LiteralType &&
      ['"length"', "'length'"].includes(keyArgument.getText())
    ) {
      return 'functions';
    }

    if (
      ts.isIdentifier(typeName) &&
      WRAPPER_NAMES.some((wrapperName) => wrapperName === typeName.text)
    ) {
      return firstArgument !== undefined &&
        typeNodeShapeClassifyLayerTransformer({ node: firstArgument, schemaNames }) === 'inferred'
        ? 'inferred'
        : 'other';
    }

    return 'other';
  }

  if (ts.isIntersectionTypeNode(node)) {
    const shapes = node.types.map((member) =>
      typeNodeShapeClassifyLayerTransformer({ node: member, schemaNames }),
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
