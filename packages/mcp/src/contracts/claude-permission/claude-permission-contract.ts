/**
 * PURPOSE: Zod schema for any entry in `.claude/settings.json` `permissions.allow` — the MCP tool
 * grants dungeonmaster generates plus the Bash grants it seeds alongside them.
 *
 * USAGE:
 * const permission = claudePermissionContract.parse('Bash(git commit:*)');
 * // Returns branded ClaudePermission type
 *
 * WHEN-TO-USE: Reading, merging, or writing the allow array as a whole — its members are a mix of
 *   `mcp__…` tool grants and `Bash(…)` command grants.
 * WHEN-NOT-TO-USE: Generating the dungeonmaster MCP tool grants themselves — those are
 *   `mcpPermissionContract`, re-branded through this contract at the merge boundary.
 */

import { z } from 'zod';

export const claudePermissionContract = z.string().brand<'ClaudePermission'>();

export type ClaudePermission = z.infer<typeof claudePermissionContract>;
