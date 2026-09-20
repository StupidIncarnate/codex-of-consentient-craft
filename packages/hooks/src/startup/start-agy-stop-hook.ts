#!/usr/bin/env node
/**
 * PURPOSE: Entry point for Antigravity Stop hook that prevents premature stops without signal-back
 *
 * USAGE:
 * echo '{"fullyIdle":true,...}' | node start-agy-stop-hook.ts
 * // Reads JSON from stdin, delegates to HookAgyStopFlow, outputs JSON decision to stdout
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { HookAgyStopFlow } from '../flows/hook-agy-stop/hook-agy-stop-flow';

export const StartAgyStopHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<AdapterResult> => {
  const result = await HookAgyStopFlow({ inputData });
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.exitCode);
};

const inputBuffer = { data: '' };
process.stdin.on('data', (chunk: Buffer) => {
  inputBuffer.data += chunk.toString();
});
process.stdin.on('end', () => {
  StartAgyStopHook({ inputData: inputBuffer.data }).catch(() => process.exit(1));
});
