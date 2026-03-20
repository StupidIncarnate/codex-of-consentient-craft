/**
 * PURPOSE: Checks if a bash command is a ward invocation piped to another command
 *
 * USAGE:
 * isWardPipedCommandGuard({ command: 'npm run ward | grep error' });
 * // Returns true because piping ward output loses valuable information
 */

const WARD_COMMAND_PATTERN = /npm\s+run\s+ward/u;

export const isWardPipedCommandGuard = ({ command }: { command?: string }): boolean => {
  if (!command) {
    return false;
  }

  if (!WARD_COMMAND_PATTERN.test(command)) {
    return false;
  }

  return command.includes('|');
};
