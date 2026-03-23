/**
 * PURPOSE: Checks if a bash command is a ward invocation piped to another command
 *
 * USAGE:
 * isWardPipedCommandGuard({ command: 'npm run ward | grep error' });
 * // Returns true because piping ward output loses valuable information
 */

// Matches "npm run ward" at a command position:
// - start of string (with optional whitespace)
// - after && or || or ; or | (shell command separators)
const WARD_AT_COMMAND_POSITION = /(?:^|[&|;]\s*|&&\s*|\|\|\s*|\|\s*)npm\s+run\s+ward/u;

// Matches a pipe character after ward arguments (not inside quotes).
// Splits on unquoted pipe to find if ward output is being piped.
const PIPE_AFTER_WARD = /npm\s+run\s+ward\b[^"']*\|/u;

export const isWardPipedCommandGuard = ({ command }: { command?: string }): boolean => {
  if (!command) {
    return false;
  }

  // "npm run ward" must appear at a command position, not inside a string argument
  if (!WARD_AT_COMMAND_POSITION.test(command)) {
    return false;
  }

  // There must be a pipe after ward that isn't inside quotes
  return PIPE_AFTER_WARD.test(command);
};
