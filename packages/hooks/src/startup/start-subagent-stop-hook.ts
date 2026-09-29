#!/usr/bin/env node
/**
 * PURPOSE: Entry point for the SubagentStop hook — reads the hook event JSON from stdin, runs it through the subagent-stop flow, and writes the block-or-allow decision to stdout
 *
 * USAGE:
 * echo '{"hook_event_name":"SubagentStop","transcript_path":"/path/agent.jsonl",...}' | npx tsx start-subagent-stop-hook.ts
 * // Writes ExecResult.stdout (block decision JSON or empty) and exits with ExecResult.exitCode
 *
 * WHEN-TO-USE: Registered by Claude Code as the SubagentStop hook command
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';

import { HookSubagentStopFlow } from '../flows/hook-subagent-stop/hook-subagent-stop-flow';

export const StartSubagentStopHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<void> => {
  const result = await HookSubagentStopFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  exit(result.exitCode);
};

readStdinToEnd()
  .then(async (inputData) => StartSubagentStopHook({ inputData }))
  .catch(() => exit(1));
