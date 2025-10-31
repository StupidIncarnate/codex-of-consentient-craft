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
    // Check for return type position
    if (current.type === 'TSTypeAnnotation') {
      const annotationParent = current.parent;

      // Check if this annotation is on a function's return type
      if (
        annotationParent &&
        'returnType' in annotationParent &&
        annotationParent.returnType === current
      ) {
        isReturnType = true;
        break;
      }

      // Check if this annotation is on a direct parameter
      // function(param: string) or (param: string) => {}
      if (annotationParent && annotationParent.type === 'Identifier') {
        const identifierParent = annotationParent.parent;
        if (
          identifierParent &&
          'params' in identifierParent &&
          Array.isArray(identifierParent.params)
        ) {
          isParameter = true;
          break;
        }
      }

      // Check if this annotation is on a destructured parameter
      // ({ param }: { param: string }) => {}
      if (annotationParent && annotationParent.type === 'ObjectPattern') {
        const objectPatternParent = annotationParent.parent;
        if (
          objectPatternParent &&
          'params' in objectPatternParent &&
          Array.isArray(objectPatternParent.params)
        ) {
          isPropertyInParameter = true;
          // Keep searching - might still be in return type context
        }
      }
    }

    current = current.parent;
  }

  // Skip reporting based on options
  if ((isParameter || isPropertyInParameter) && allowPrimitiveInputs) {
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
