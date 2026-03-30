/**
 * PURPOSE: Checks if a bash command is a ward invocation (npm run ward or dungeonmaster-ward)
 *
 * USAGE:
 * isWardCommandGuard({ command: 'npm run ward -- --only unit' });
 * // Returns true
 */

const WARD_COMMAND_PATTERN =
  /(?:^|\s*&&\s*|\s*;\s*|\s*\|\|\s*)(?:npm\s+run\s+ward|dungeonmaster-ward)(?:\s|$)/u;

export const isWardCommandGuard = ({ command }: { command?: string }): boolean => {
  if (!command) {
    return false;
  }

  return WARD_COMMAND_PATTERN.test(command);
};
