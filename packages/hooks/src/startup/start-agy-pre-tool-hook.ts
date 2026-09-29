#!/usr/bin/env node
/**
 * PURPOSE: Entry point for Antigravity PreToolUse hook that blocks bad tools/commands and audits edits
 *
 * USAGE:
 * echo '{"toolCall":...}' | node start-agy-pre-tool-hook.ts
 * // Reads JSON from stdin, delegates to HookAgyPreToolFlow, outputs JSON decision to stdout
 */

import { exit, readStdinToEnd, stderr, stdout } from '#gateway/node/process';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { HookAgyPreToolFlow } from '../flows/hook-agy-pre-tool/hook-agy-pre-tool-flow';

export const StartAgyPreToolHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<AdapterResult> => {
  const result = await HookAgyPreToolFlow({ inputData });
  stderr.write(result.stderr);
  stdout.write(result.stdout);
  return exit(result.exitCode);
};

readStdinToEnd()
  .then(async (inputData) => StartAgyPreToolHook({ inputData }))
  .catch(() => exit(1));
