/**
 * PURPOSE: Checks if a bash command is a direct invocation of jest, eslint, or tsc that should be blocked
 *
 * USAGE:
 * isBlockedQualityCommandGuard({ command: 'npx jest --verbose' });
 * // Returns true because direct jest invocation should use dungeonmaster-ward instead
 */

const BLOCKED_COMMAND_PATTERN =
  /(?:^|\s*&&\s*|\s*;\s*|\s*\|\|\s*)(?:npx\s+)?(?:jest|eslint|tsc)(?:\s|$)/u;

const ALLOWED_COMMAND_PATTERN =
  /(?:dungeonmaster-ward|npx\s+dungeonmaster-ward|npm\s+run\s+test|npm\s+run\s+lint|npm\s+run\s+typecheck|npm\s+test|npm\s+run\s+ward)/u;

export const isBlockedQualityCommandGuard = ({ command }: { command?: string }): boolean => {
  if (command === undefined) {
    return false;
  }

  if (ALLOWED_COMMAND_PATTERN.test(command)) {
    return false;
  }

  return BLOCKED_COMMAND_PATTERN.test(command);
};
