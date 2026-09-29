/**
 * PURPOSE: Checks if an AST array element is a string Literal whose value classifies as a quest-status or work-item-status literal.
 *
 * USAGE:
 * isClassifiedStatusLiteralElementGuard({ element });
 * // Returns true when element is a Literal with a string value in the status enums.
 *
 * WHEN-TO-USE: Only the ban-quest-status-literals rule / helpers should call this.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { classifyStatusLiteralTransformer } from '../../transformers/classify-status-literal/classify-status-literal-transformer';

export const isClassifiedStatusLiteralElementGuard = ({
  element,
}: {
  element?: TSESTree.Node | null;
}): boolean => {
  if (element === null || element === undefined) {
    return false;
  }
  if (element.type !== AST_NODE_TYPES.Literal) {
    return false;
  }
  if (typeof element.value !== 'string') {
    return false;
  }
  return classifyStatusLiteralTransformer({ literal: element.value }) !== null;
};
