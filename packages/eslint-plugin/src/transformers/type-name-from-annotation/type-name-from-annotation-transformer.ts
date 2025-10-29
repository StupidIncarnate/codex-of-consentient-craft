/**
 * PURPOSE: Extracts the type name from a TypeScript type annotation AST node
 *
 * USAGE:
 * const typeName = typeNameFromAnnotationTransformer({ typeAnnotation: node.typeAnnotation });
 * // Returns 'User' for const user: User = { id: '1' }
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { identifierContract, type Identifier } from '@questmaestro/shared/contracts';

export const typeNameFromAnnotationTransformer = ({
  typeAnnotation,
}: {
  typeAnnotation?: Tsestree | null;
}): Identifier | null => {
  if (!typeAnnotation) {
    return null;
  }

  // TSTypeAnnotation wraps the actual type
  if (typeAnnotation.type === 'TSTypeAnnotation') {
    const innerAnnotation = typeAnnotation.typeAnnotation;
    if (!innerAnnotation) {
      return null;
    }
    return typeNameFromAnnotationTransformer({
      typeAnnotation: innerAnnotation,
    });
  }

  // TSTypeReference contains the type name
  if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName) {
    // Simple identifier (e.g., User)
    if (typeAnnotation.typeName.type === 'Identifier' && typeAnnotation.typeName.name) {
      return identifierContract.parse(typeAnnotation.typeName.name);
    }
  }

  // TSArrayType (e.g., User[])
  if (typeAnnotation.type === 'TSArrayType') {
    // Try elementType first (some parsers), then typeAnnotation
    const elementType = typeAnnotation.elementType ?? typeAnnotation.typeAnnotation;
    if (!elementType) {
      return null;
    }
    return typeNameFromAnnotationTransformer({
      typeAnnotation: elementType,
    });
  }

  // Generic types (e.g., Array<User>)
  if (
    typeAnnotation.type === 'TSTypeReference' &&
    typeAnnotation.typeName?.type === 'Identifier' &&
    typeAnnotation.typeName.name
  ) {
    return identifierContract.parse(typeAnnotation.typeName.name);
  }

  return null;
};
