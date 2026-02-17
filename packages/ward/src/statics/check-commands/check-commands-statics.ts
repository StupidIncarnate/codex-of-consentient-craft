/**
 * PURPOSE: Maps each check type to its spawn command and arguments
 *
 * USAGE:
 * const {command, args} = checkCommandsStatics.lint;
 * // Returns: {command: 'npx', args: ['eslint', '--format', 'json', '.']}
 */
export const checkCommandsStatics = {
  lint: { command: 'npx', args: ['eslint', '--format', 'json', '.'] },
  typecheck: { command: 'npx', args: ['tsc', '--noEmit'] },
  test: { command: 'npx', args: ['jest', '--json', '--no-color'] },
  e2e: { command: 'npx', args: ['playwright', 'test', '--reporter', 'json'] },
} as const;
