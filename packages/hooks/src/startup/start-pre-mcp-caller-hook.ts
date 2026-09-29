#!/usr/bin/env node
/**
 * PURPOSE: Entry point for the PreToolUse hook that stamps the caller's cwd, session and sub-agent
 *   id onto every dungeonmaster MCP call
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-mcp-caller-hook.ts
 * // Reads JSON from stdin and writes the updatedInput to stdout
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';

import { HookPreMcpCallerFlow } from '../flows/hook-pre-mcp-caller/hook-pre-mcp-caller-flow';

export const StartPreMcpCallerHook = ({ inputData }: { inputData: string }): void => {
  const result = HookPreMcpCallerFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  exit(result.exitCode);
};

readStdinToEnd()
  .then((inputData) => {
    StartPreMcpCallerHook({ inputData });
  })
  .catch(() => exit(1));
