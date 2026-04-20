#!/usr/bin/env node
/**
 * PURPOSE: Entry point for pre-bash hook that blocks direct jest/eslint/tsc invocations
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-bash-hook.ts
 * // Reads JSON from stdin, validates, checks if command is blocked, exits with code 2 if blocked
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookPreBashFlow } from '../flows/hook-pre-bash/hook-pre-bash-flow';

export const StartPreBashHook = ({ inputData }: { inputData: string }): AdapterResult => {
  const result = HookPreBashFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartPreBashHook({ inputData: inputBuffer.data });
});
