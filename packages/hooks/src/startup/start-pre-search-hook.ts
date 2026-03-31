#!/usr/bin/env node
/**
 * PURPOSE: Entry point for pre-search hook that blocks Grep/Glob and suggests the discover MCP tool
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-search-hook.ts
 * // Reads JSON from stdin, validates, blocks search tools with exit code 2
 */

import { HookPreSearchFlow } from '../flows/hook-pre-search/hook-pre-search-flow';

export const StartPreSearchHook = ({ inputData }: { inputData: string }): void => {
  const result = HookPreSearchFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartPreSearchHook({ inputData: inputBuffer.data });
});
