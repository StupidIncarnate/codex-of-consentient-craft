#!/usr/bin/env node
/**
 * PURPOSE: Entry point for pre-edit hook that validates and processes tool use events
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-edit-hook.ts
 * // Reads JSON from stdin, validates, checks violations, exits with code 2 if blocked
 */

import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';

export const StartPreEditHook = async ({ inputData }: { inputData: string }): Promise<void> => {
  const result = await HookPreEditFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartPreEditHook({ inputData: inputBuffer.data }).catch(() => process.exit(1));
});
