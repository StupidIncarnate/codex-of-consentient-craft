#!/usr/bin/env node
/**
 * PURPOSE: Entry point for the PreToolUse hook that stamps the caller's cwd, session and sub-agent
 *   id onto every dungeonmaster MCP call
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-mcp-caller-hook.ts
 * // Reads JSON from stdin and writes the updatedInput to stdout
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookPreMcpCallerFlow } from '../flows/hook-pre-mcp-caller/hook-pre-mcp-caller-flow';

export const StartPreMcpCallerHook = ({ inputData }: { inputData: string }): AdapterResult => {
  const result = HookPreMcpCallerFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartPreMcpCallerHook({ inputData: inputBuffer.data });
});
