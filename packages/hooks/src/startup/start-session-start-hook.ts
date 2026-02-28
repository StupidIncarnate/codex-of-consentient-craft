#!/usr/bin/env node
/**
 * PURPOSE: Entry point for session start hook that loads standards for new sessions
 *
 * USAGE:
 * echo '{"hook_event_name":"SessionStart",...}' | node start-session-start-hook.ts
 * // Reads JSON from stdin, validates, outputs standards content to stdout if new session
 */

import { HookSessionStartFlow } from '../flows/hook-session-start/hook-session-start-flow';

export const StartSessionStartHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<void> => {
  const result = await HookSessionStartFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartSessionStartHook({ inputData: inputBuffer.data }).catch(() => process.exit(1));
});
