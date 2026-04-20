#!/usr/bin/env node
/**
 * PURPOSE: Entry point for post-edit hook that runs ESLint auto-fix and reports remaining errors
 *
 * USAGE:
 * echo '{"hook_event_name":"PostToolUse",...}' | node start-post-edit-hook.ts
 * // Reads JSON from stdin, runs auto-fix, reports remaining error-level violations, exits with code 0
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { HookPostEditFlow } from '../flows/hook-post-edit/hook-post-edit-flow';

export const StartPostEditHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<AdapterResult> => {
  const result = await HookPostEditFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartPostEditHook({ inputData: inputBuffer.data }).catch(() => process.exit(1));
});
