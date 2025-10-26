import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { identifierContract, type Identifier } from '@questmaestro/shared/contracts';

/**
 * Extract the type name from a TypeScript type annotation AST node
 *
 * Purpose:
 * When ESLint parses TypeScript code, type annotations become complex AST structures.
 * This transformer walks those AST nodes to extract the actual type name as a string.
 *
 * Example:
 * ```typescript
 * const user: User = { id: '1' };
 * //          ^^^^
 * //          This becomes a TSTypeAnnotation node containing a TSTypeReference node
 * //          This function extracts "User" from that structure
 * ```
 *
 * Supported Type Syntaxes:
 * - TSTypeReference: `const a: User = {}` → returns "User"
 * - TSArrayType: `const b: User[] = []` → returns "User" (element type)
 * - Generic types: `const c: Array<User> = []` → returns "Array"
 * - Wrapped annotations: Automatically unwraps TSTypeAnnotation wrappers
 *
 * Returns:
 * - Identifier (branded Zod string) containing the type name
 * - null if no type name can be extracted (primitives, unknown node types, etc.)
 *
 * Used by: @questmaestro/enforce-stub-usage rule to detect typed object/array literals
 */
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
