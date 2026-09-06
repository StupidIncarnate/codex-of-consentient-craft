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
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
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
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });
  // Walk up the AST to determine context
  let current = node.parent;
  let isParameter = false;
  let isReturnType = false;
  let isPropertyInParameter = false;

  while (current) {
    // Check if this annotation is on a function's return type
    if (current.type === 'TSTypeAnnotation') {
      const annotationParent = current.parent;
      if (annotationParent) {
        const isReturnTypeCheck =
          'returnType' in annotationParent && annotationParent.returnType === current;
        if (isReturnTypeCheck) {
          isReturnType = true;
          break;
        }

        // Check if this annotation is on a direct parameter — possibly defaulted
        // (`(x: T = value) => {}`), in which case the Identifier's immediate parent is an
        // AssignmentPattern rather than the function itself, so `.params` lives one level up.
        if (annotationParent.type === 'Identifier') {
          const identifierParent = annotationParent.parent;
          const paramHolder =
            identifierParent && identifierParent.type === 'AssignmentPattern'
              ? identifierParent.parent
              : identifierParent;
          const hasParams =
            paramHolder && 'params' in paramHolder && Array.isArray(paramHolder.params);
          if (hasParams) {
            isParameter = true;
            break;
          }
        }

        // Check if this annotation is on a destructured parameter — possibly defaulted
        // (`({x}: T = {}) => {}`), in which case the ObjectPattern's immediate parent is an
        // AssignmentPattern rather than the function itself, so `.params` lives one level up.
        if (annotationParent.type === 'ObjectPattern') {
          const objectPatternParent = annotationParent.parent;
          const paramHolder =
            objectPatternParent && objectPatternParent.type === 'AssignmentPattern'
              ? objectPatternParent.parent
              : objectPatternParent;
          const hasParams =
            paramHolder && 'params' in paramHolder && Array.isArray(paramHolder.params);
          if (hasParams) {
            isPropertyInParameter = true;
            break;
          }
        }
      }
    }

    current = current.parent;
  }

  const isInputContext = isParameter || isPropertyInParameter;
  if (isInputContext && allowPrimitiveInputs) {
    return result;
  }

  if (isReturnType && allowPrimitiveReturns) {
    return result;
  }

  ctx.report({
    node,
    messageId: 'banPrimitive',
    data: {
      typeName,
      suggestion,
    },
  });
  return result;
};
