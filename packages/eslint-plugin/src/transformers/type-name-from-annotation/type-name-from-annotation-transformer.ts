/**
 * PURPOSE: Extracts the type name from a TypeScript type annotation AST node
 *
 * USAGE:
 * const typeName = typeNameFromAnnotationTransformer({ typeAnnotation: node.typeAnnotation });
 * // Returns 'User' for const user: User = { id: '1' }
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';

export const typeNameFromAnnotationTransformer = ({
  typeAnnotation,
}: {
  typeAnnotation?: TSESTree.Node | null;
}): Identifier | null => {
  if (!typeAnnotation) {
    return null;
  }

  // TSTypeAnnotation wraps the actual type
  if (typeAnnotation.type === AST_NODE_TYPES.TSTypeAnnotation) {
    const innerAnnotation = typeAnnotation.typeAnnotation;
    return typeNameFromAnnotationTransformer({
      typeAnnotation: innerAnnotation,
    });
  }

  // TSTypeReference contains the type name
  if (typeAnnotation.type === AST_NODE_TYPES.TSTypeReference) {
    // Simple identifier (e.g., User)
    if (
      typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
      typeAnnotation.typeName.name
    ) {
      return identifierContract.parse(typeAnnotation.typeName.name);
    }
  }

  // TSArrayType (e.g., User[])
  if (typeAnnotation.type === AST_NODE_TYPES.TSArrayType) {
    // Try elementType first (some parsers), then typeAnnotation
    const { elementType } = typeAnnotation;
    return typeNameFromAnnotationTransformer({
      typeAnnotation: elementType,
    });
  }

  // Generic types (e.g., Array<User>)
  if (
    typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
    typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
    typeAnnotation.typeName.name
  ) {
    return identifierContract.parse(typeAnnotation.typeName.name);
  }

  return null;
};
