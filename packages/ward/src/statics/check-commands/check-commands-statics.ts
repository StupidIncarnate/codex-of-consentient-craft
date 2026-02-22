/**
 * PURPOSE: Maps each check type to its binary name and arguments
 *
 * USAGE:
 * const {bin, args} = checkCommandsStatics.lint;
 * // Returns: {bin: 'eslint', args: ['--fix', '--format', 'json', '.']}
 */
export const checkCommandsStatics = {
  lint: { bin: 'eslint', args: ['--fix', '--format', 'json', '.'] },
  typecheck: { bin: 'tsc', args: ['--noEmit', '--listFiles'] },
  unit: {
    bin: 'jest',
    args: ['--json', '--no-color', '--forceExit', '--detectOpenHandles'],
  },
  e2e: {
    bin: 'playwright',
    args: ['test', '--reporter=json'],
  },
} as const;
