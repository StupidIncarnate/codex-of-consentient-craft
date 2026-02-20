/**
 * PURPOSE: Maps each check type to its spawn command and arguments
 *
 * USAGE:
 * const {command, args} = checkCommandsStatics.lint;
 * // Returns: {command: 'npx', args: ['eslint', '--format', 'json', '.']}
 */
export const checkCommandsStatics = {
  lint: { command: 'npx', args: ['eslint', '--fix', '--format', 'json', '.'] },
  typecheck: { command: 'npx', args: ['tsc', '--noEmit', '--listFiles'] },
  unit: {
    command: 'npx',
    args: ['jest', '--json', '--no-color', '--forceExit', '--detectOpenHandles'],
  },
  e2e: {
    command: 'npx',
    args: ['playwright', 'test', '--reporter=json'],
  },
} as const;
