/**
 * PURPOSE: Checks if an AST array element is a string Literal whose value classifies as a quest-status or work-item-status literal.
 *
 * USAGE:
 * isClassifiedStatusLiteralElementGuard({ element });
 * // Returns true when element is a Literal with a string value in the status enums.
 *
 * WHEN-TO-USE: Only the ban-quest-status-literals rule / helpers should call this.
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { classifyStatusLiteralTransformer } from '../../transformers/classify-status-literal/classify-status-literal-transformer';

export const isClassifiedStatusLiteralElementGuard = ({
  element,
}: {
  element?: Tsestree | null;
}): boolean => {
  if (element === null || element === undefined) {
    return false;
  }
  if (element.type !== 'Literal') {
    return false;
  }
  if (typeof element.value !== 'string') {
    return false;
  }
  return classifyStatusLiteralTransformer({ literal: element.value }) !== null;
};
