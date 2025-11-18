/**
 * PURPOSE: Layer helper that checks if a primitive type usage violates the ban-primitives rule based on context
 *
 * USAGE:
 * checkPrimitiveViolationLayerBroker({
 *   node,
 *   typeName: 'string',
 *   suggestion: 'EmailAddress, UserName, FilePath, etc.',
 *   allowPrimitiveInputs: true,
 *   allowPrimitiveReturns: false,
 *   ctx,
 * });
 * // Reports error if primitive is used in a forbidden context (e.g., return type when allowPrimitiveReturns is false)
 */
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkPrimitiveViolationLayerBroker = ({
  node,
  typeName,
  suggestion,
  allowPrimitiveInputs,
  allowPrimitiveReturns,
  ctx,
}: {
  node: Tsestree;
  typeName: string;
  suggestion: string;
  allowPrimitiveInputs: boolean;
  allowPrimitiveReturns: boolean;
  ctx: EslintContext;
}): void => {
  // Walk up the AST to determine context
  let current = node.parent;
  let isParameter = false;
  let isReturnType = false;
  let isPropertyInParameter = false;

  while (current) {
    if (current.type !== 'TSTypeAnnotation') {
      current = current.parent;
      continue;
    }

    const annotationParent = current.parent;
    if (!annotationParent) {
      current = current.parent;
      continue;
    }

    // Check if this annotation is on a function's return type
    const isReturnTypeCheck =
      'returnType' in annotationParent && annotationParent.returnType === current;
    if (isReturnTypeCheck) {
      isReturnType = true;
      break;
    }

    // Check if this annotation is on a direct parameter
    if (annotationParent.type === 'Identifier') {
      const identifierParent = annotationParent.parent;
      const hasParams =
        identifierParent && 'params' in identifierParent && Array.isArray(identifierParent.params);
      if (hasParams) {
        isParameter = true;
        break;
      }
    }

    // Check if this annotation is on a destructured parameter
    if (annotationParent.type === 'ObjectPattern') {
      const objectPatternParent = annotationParent.parent;
      const hasParams =
        objectPatternParent &&
        'params' in objectPatternParent &&
        Array.isArray(objectPatternParent.params);
      if (hasParams) {
        isPropertyInParameter = true;
      }
    }

    current = current.parent;
  }

  // Skip reporting based on options
  const isInputContext = isParameter || isPropertyInParameter;
  if (isInputContext && allowPrimitiveInputs) {
    return;
  }

  if (isReturnType && allowPrimitiveReturns) {
    return;
  }

  ctx.report({
    node,
    messageId: 'banPrimitive',
    data: {
      typeName,
      suggestion,
    },
  });
};
