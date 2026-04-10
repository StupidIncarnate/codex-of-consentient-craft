#!/usr/bin/env node
/**
 * PURPOSE: Entry point for session snippet hook that outputs a specific architecture snippet by key
 *
 * USAGE:
 * echo '{}' | dungeonmaster-session-snippet discover
 * // Reads snippet key from argv[2], outputs that snippet content to stdout
 *
 * WHEN-TO-USE: Called by Claude CLI as a SessionStart hook for each registered snippet key
 */

import { HookSessionSnippetFlow } from '../flows/hook-session-snippet/hook-session-snippet-flow';

const [, , snippetKey] = process.argv;

// Drain stdin (Claude CLI sends SessionStart JSON; must consume to avoid hanging)
process.stdin.resume();
process.stdin.on('end', () => {
  const result = HookSessionSnippetFlow({ snippetKey });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
});
