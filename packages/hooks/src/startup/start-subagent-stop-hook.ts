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

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookSubagentStopFlow } from '../flows/hook-subagent-stop/hook-subagent-stop-flow';

export const StartSubagentStopHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<AdapterResult> => {
  const result = await HookSubagentStopFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartSubagentStopHook({ inputData: inputBuffer.data }).catch(() => process.exit(1));
});
