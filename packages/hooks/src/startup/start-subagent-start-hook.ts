#!/usr/bin/env node
/**
 * PURPOSE: Entry point for subagent start hook that injects architecture and discover guidance into subagents
 *
 * USAGE:
 * echo '{"hook_event_name":"SubagentStart","agent_id":"...","agent_type":"Explore",...}' | node start-subagent-start-hook.ts
 * // Reads JSON from stdin, outputs architecture + discover guidance to stdout
 */

import { HookSubagentStartFlow } from '../flows/hook-subagent-start/hook-subagent-start-flow';

export const StartSubagentStartHook = ({ inputData }: { inputData: string }): void => {
  const result = HookSubagentStartFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  try {
    StartSubagentStartHook({ inputData: inputBuffer.data });
  } catch {
    process.exit(1);
  }
});
