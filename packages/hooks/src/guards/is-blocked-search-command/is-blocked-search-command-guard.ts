/**
 * PURPOSE: Checks if a bash command is a direct invocation of grep, rg, or find that should use discover instead
 *
 * USAGE:
 * isBlockedSearchCommandGuard({ command: 'grep -r "pattern" src/' });
 * // Returns true because direct grep invocation should use discover MCP tool instead
 */

const BLOCKED_SEARCH_PATTERN = /(?:^|\s*&&\s*|\s*;\s*|\s*\|\|\s*)(?:grep|rg|find)(?:\s|$)/u;

export const isBlockedSearchCommandGuard = ({ command }: { command?: string }): boolean => {
  if (command === undefined) {
    return false;
  }

  if (command.includes('|')) {
    return false;
  }

  return BLOCKED_SEARCH_PATTERN.test(command);
};
