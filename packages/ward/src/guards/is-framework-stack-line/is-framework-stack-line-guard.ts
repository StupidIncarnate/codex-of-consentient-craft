/**
 * PURPOSE: Checks if a stack trace line is a framework-internal line that adds no diagnostic value
 *
 * USAGE:
 * isFrameworkStackLineGuard({line: '    at callAsyncCircusFn (node_modules/jest-circus/build/...)'});
 * // Returns true if the line is from jest-circus, jest-runner, etc.
 */

import { frameworkStackPatternsStatics } from '../../statics/framework-stack-patterns/framework-stack-patterns-statics';

export const isFrameworkStackLineGuard = ({ line }: { line?: string }): boolean => {
  if (!line) {
    return false;
  }

  return frameworkStackPatternsStatics.patterns.some((pattern) => line.includes(pattern));
};
