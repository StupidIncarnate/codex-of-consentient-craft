#!/usr/bin/env node
/**
 * PURPOSE: Entry point for Antigravity Stop hook that prevents premature stops without signal-back
 *
 * USAGE:
 * echo '{"fullyIdle":true,...}' | node start-agy-stop-hook.ts
 * // Reads JSON from stdin, delegates to HookAgyStopFlow, outputs JSON decision to stdout
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';
import { HookAgyStopFlow } from '../flows/hook-agy-stop/hook-agy-stop-flow';

export const StartAgyStopHook = async ({ inputData }: { inputData: string }): Promise<void> => {
  const result = await HookAgyStopFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  exit(result.exitCode);
};

readStdinToEnd()
  .then(async (inputData) => StartAgyStopHook({ inputData }))
  .catch(() => exit(1));
